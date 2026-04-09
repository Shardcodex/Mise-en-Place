import type { IngredientInput, IngredientCategory } from "./types";

export interface ParsedRecipe {
  name: string;
  emoji: string;
  servings: number;
  time: string;
  tags: string[];
  ingredients: IngredientInput[];
  steps: string[];
}

export function smartParseRecipe(raw: string, nameOverride?: string): ParsedRecipe {
  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);

  let mode: "unknown" | "ingredients" | "steps" | "meta" = "unknown";
  const ingLines: string[] = [];
  const stepLines: string[] = [];
  let detectedName = nameOverride || "";
  let detectedServings = 4;
  let detectedTime = "";

  const ingHeaders = /^(ingredients|what you.?ll need|you.?ll need|shopping list|for the)\b/i;
  const stepHeaders = /^(instructions|directions|steps|method|preparation|how to make|procedure)\b/i;
  const metaHeaders = /^(notes|tips|nutrition|serving|source|adapted|keywords|cuisine|equipment|description)\b/i;

  if (!detectedName && lines.length > 0) {
    const first = lines[0];
    if (first.length < 80 && !looksLikeIngredient(first) && !ingHeaders.test(first) && !stepHeaders.test(first)) {
      detectedName = first.replace(/^#+\s*/, "").replace(/recipe$/i, "").trim();
    }
  }

  for (const line of lines) {
    if (line.replace(/^#+\s*/, "").replace(/recipe$/i, "").trim() === detectedName && detectedName) continue;

    if (ingHeaders.test(line.replace(/[:#*]/g, "").trim())) { mode = "ingredients"; continue; }
    if (stepHeaders.test(line.replace(/[:#*]/g, "").trim())) { mode = "steps"; continue; }
    if (metaHeaders.test(line.replace(/[:#*]/g, "").trim())) { mode = "meta"; continue; }

    const servMatch = line.match(/(?:serves?|servings?|yield|makes)[:\s]*(\d+)/i);
    if (servMatch) { detectedServings = parseInt(servMatch[1]); continue; }

    const timeMatch = line.match(/(?:(?:total|cook|prep)\s*time)[:\s]*([\d]+\s*(?:min|hour|hr|minute|h|m)[\w\s]*)/i);
    if (timeMatch) { detectedTime = timeMatch[1].trim(); continue; }

    if (mode === "meta") continue;

    if (mode === "unknown") {
      if (looksLikeIngredient(line)) mode = "ingredients";
      else if (looksLikeStep(line)) mode = "steps";
    }

    if (mode === "ingredients") {
      if (looksLikeIngredient(line)) { ingLines.push(line); }
      else if (looksLikeStep(line)) { mode = "steps"; stepLines.push(line); }
      else ingLines.push(line);
    } else if (mode === "steps") {
      if (looksLikeStep(line)) { stepLines.push(line); }
      else if (looksLikeIngredient(line) && !stepLines.length) { mode = "ingredients"; ingLines.push(line); }
      else stepLines.push(line);
    } else {
      if (looksLikeIngredient(line)) { ingLines.push(line); mode = "ingredients"; }
      else if (looksLikeStep(line)) { stepLines.push(line); mode = "steps"; }
    }
  }

  const ingredients = ingLines.map(parseIngredientLine).filter((i): i is IngredientInput => i !== null);

  const steps = stepLines
    .map((s) => s.replace(/^\d+[\.\)\-:\s]+/, "").replace(/^\*+\s*/, "").replace(/^-\s*/, "").trim())
    .filter((s) => s.length > 5);

  // Add @references
  const stepsWithRefs = steps.map((step) => {
    let result = step;
    ingredients.forEach((ing) => {
      if (!ing.name || ing.name.length < 3) return;
      const escaped = ing.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp("\\b(" + escaped + ")\\b", "i");
      if (rx.test(result) && !result.includes("@" + ing.name)) {
        result = result.replace(rx, "@" + ing.name);
      }
    });
    return result;
  });

  const text = (detectedName + " " + ingredients.map((i) => i.name).join(" ")).toLowerCase();
  const emoji = pickEmoji(text);

  return {
    name: detectedName || "Imported Recipe",
    emoji,
    servings: detectedServings,
    time: detectedTime,
    tags: [],
    ingredients,
    steps: stepsWithRefs,
  };
}

function looksLikeIngredient(line: string): boolean {
  const l = line.replace(/^[-•*▪▸◦]\s*/, "").trim();
  if (/^[\d¼½¾⅓⅔⅛⅜⅝⅞]/.test(l)) return true;
  if (/^\(?\d+\/\d+\)?/.test(l)) return true;
  if (/^(a |one |two |three |four |five |six |pinch|dash|handful|bunch)/i.test(l)) return true;
  if (/^.{3,}\(.*\)\s*$/.test(l) && l.length < 120) return true;
  if (l.length < 80 && !l.includes(".") && !/^\d+[\.\)]/.test(l)) return true;
  return false;
}

function looksLikeStep(line: string): boolean {
  const l = line.replace(/^[-•*]\s*/, "").trim();
  if (/^\d+[\.\)]\s*\w/.test(l)) return true;
  if (l.length > 90 && !/^[\d¼½¾⅓⅔⅛⅜⅝⅞]/.test(l)) return true;
  if (
    /\b(cook|bake|stir|mix|heat|add|combine|pour|place|preheat|whisk|fold|chop|dice|slice|bring|simmer|boil|sauté|saute|season|serve|let|remove|set|transfer|cover|drain|rinse)\b/i.test(l) &&
    l.length > 30 &&
    !/^[\d¼½¾⅓⅔⅛⅜⅝⅞]/.test(l)
  )
    return true;
  return false;
}

function parseIngredientLine(line: string): IngredientInput | null {
  let l = line.replace(/^[-•*▪▸◦]\s*/, "").replace(/^\d+[\.\)]\s*/, "").trim();
  if (!l) return null;

  const units =
    "cups?|tbsps?|tsps?|tablespoons?|teaspoons?|ounces?|oz|lbs?|pounds?|g|grams?|kg|kilograms?|ml|liters?|litres?|l|pinch(?:es)?|dash(?:es)?|cloves?|cans?|packages?|pkgs?|bunche?s?|heads?|stalks?|slices?|pieces?|sprigs?|handfuls?|sticks?|bags?";
  const unitRx = new RegExp(
    "^([\\d¼½¾⅓⅔⅛⅜⅝⅞/\\s\\.]+)\\s*(" + units + ")\\b[\\s\\.of]*(.+)",
    "i"
  );
  const simpleRx = /^([\d¼½¾⅓⅔⅛⅜⅝⅞/\s\.]+)\s+(.+)/;

  let amount = "";
  let unit = "";
  let name = l;

  const m1 = l.match(unitRx);
  if (m1) {
    amount = m1[1].trim();
    unit = m1[2].trim().replace(/\.$/, "");
    name = m1[3].trim();
  } else {
    const m2 = l.match(simpleRx);
    if (m2) {
      amount = m2[1].trim();
      name = m2[2].trim();
    }
  }

  name = name.replace(/\(.*?\)/g, "").replace(/,\s*$/, "").trim();
  name = name.replace(/https?:\/\/\S+/g, "").trim();
  if (!name) return null;

  const category = guessCategory(name);
  return { name, amount, unit, category };
}

function guessCategory(name: string): IngredientCategory {
  const n = name.toLowerCase();
  const rules: [RegExp, IngredientCategory][] = [
    [/\b(chicken|beef|pork|lamb|turkey|bacon|sausage|prosciutto|guanciale|pancetta|ham|steak|ground meat|mince|shrimp|prawn|salmon|tuna|cod|fish|crab|lobster|scallop|mussel|clam|anchov|meatball|pepperoni)\b/i, "Meat & Seafood"],
    [/\b(milk|cream|butter|cheese|yogurt|yoghurt|sour cream|ricotta|mozzarella|parmesan|pecorino|cheddar|egg|eggs|egg yolk|egg white|whipping cream|half.and.half|crème|cream cheese|buttermilk)\b/i, "Dairy"],
    [/\b(bread|baguette|tortilla|pita|naan|rolls?|buns?|croissant|flatbread|ciabatta|sourdough|brioche|wrap|wonton wrapper)\b/i, "Bakery"],
    [/\b(frozen|ice cream)\b/i, "Frozen"],
    [/\b(water|juice|wine|beer|broth|stock|soda|coffee|tea|coconut water|apple cider|milk)\b/i, "Beverages"],
    [/\b(lettuce|spinach|arugula|kale|tomato|onion|garlic|ginger|potato|carrot|celery|pepper|bell pepper|jalapeño|jalapeno|cucumber|zucchini|squash|eggplant|mushroom|broccoli|cauliflower|corn|peas|bean sprout|avocado|lemon|lime|orange|apple|banana|berry|berries|mango|pineapple|peach|pear|grape|melon|basil|cilantro|parsley|mint|rosemary|thyme|dill|chive|scallion|green onion|shallot|leek|cabbage|beet|radish|turnip|artichoke|asparagus|fennel|herb|fresh|sweet potato|green bean)\b/i, "Produce"],
    [/\b(flour|sugar|salt|pepper|oil|olive oil|vinegar|soy sauce|pasta|rice|noodle|oat|cereal|honey|maple|syrup|vanilla|baking|cocoa|chocolate|spice|cumin|paprika|cinnamon|nutmeg|oregano|turmeric|curry|chili|powder|sauce|ketchup|mustard|mayo|dressing|can of|canned|dried|cornstarch|baking soda|baking powder|yeast|sesame|peanut|almond|walnut|cashew|nut|seed|chia|flax|coconut|panko|breadcrumb|paste|jam|jelly|preserve|quinoa|ranch|worcestershire|sriracha|cornmeal)\b/i, "Pantry"],
  ];
  for (const [rx, cat] of rules) {
    if (rx.test(n)) return cat;
  }
  return "Other";
}

function pickEmoji(text: string): string {
  const rules: [RegExp, string][] = [
    [/pasta|spaghetti|linguine|penne|fettuccin|ziti|lasagna|alfredo|noodle|ramen|udon/, "🍝"],
    [/salad|lettuce|greens|arugula|kale/, "🥗"],
    [/soup|stew|chowder|chili|bisque|broth/, "🍲"],
    [/curry|tikka|masala|korma|vindaloo/, "🍛"],
    [/taco|burrito|enchilada|quesadilla|mexican|fajita/, "🌮"],
    [/pizza|dough/, "🍕"],
    [/burger|hamburger|slider/, "🍔"],
    [/sushi|sashimi|maki|yakisoba/, "🍜"],
    [/pancake|waffle|crepe|french toast/, "🥞"],
    [/cake|cupcake|brownie|muffin/, "🍰"],
    [/cookie|biscuit|meringue/, "🍪"],
    [/pie|tart|galette/, "🥧"],
    [/bread|sandwich|toast|cornbread|garlic bread/, "🍞"],
    [/chicken|poultry|turkey|tenders|cutlet/, "🍗"],
    [/steak|beef|korean beef|meatball/, "🥩"],
    [/fish|salmon|tuna|cod|seafood/, "🐟"],
    [/shrimp|prawn|lobster|crab|wonton|dumpling|gyoza/, "🥟"],
    [/egg|omelette|frittata|quiche|casserole/, "🍳"],
    [/rice|fried rice|risotto|pilaf|quinoa|bowl/, "🍚"],
    [/smoothie|shake|drink|juice|cider|yogurt/, "🥤"],
    [/ice cream|gelato|sorbet/, "🍨"],
    [/potato|mashed|hash brown|sweet potato/, "🥔"],
    [/green bean|carrot|roasted/, "🥕"],
    [/ham|bacon|pork/, "🥓"],
    [/apple/, "🍎"],
  ];
  for (const [rx, em] of rules) {
    if (rx.test(text)) return em;
  }
  return "🍽️";
}

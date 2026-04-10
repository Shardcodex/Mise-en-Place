"use client";

import { useState } from "react";
import {
  X, ClipboardPaste, Clipboard, Wand2, CheckCircle2, Pencil, Check,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Tag from "@/components/ui/Tag";
import { smartParseRecipe, type ParsedRecipe } from "@/lib/parser";
import type { RecipeInput } from "@/lib/types";

interface PasteImportModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: RecipeInput) => Promise<void>;
  onEditInForm: (parsed: ParsedRecipe) => void;
}

export default function PasteImportModal({
  open,
  onClose,
  onSave,
  onEditInForm,
}: PasteImportModalProps) {
  const [rawText, setRawText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null);
  const [saving, setSaving] = useState(false);

  function handleParse() {
    if (!rawText.trim()) return;
    const result = smartParseRecipe(rawText);
    setParsed(result);
  }

  async function handleConfirmSave() {
    if (!parsed) return;
    setSaving(true);
    const input: RecipeInput = {
      name: parsed.name,
      emoji: parsed.emoji,
      servings: parsed.servings,
      time: parsed.time,
      tags: parsed.tags,
      source_url: sourceUrl.trim(),
      ingredients: parsed.ingredients,
      steps: parsed.steps,
    };
    await onSave(input);
    setSaving(false);
    resetAndClose();
  }

  function handleEditInForm() {
    if (!parsed) return;
    onEditInForm({ ...parsed });
    resetAndClose();
  }

  function resetAndClose() {
    setRawText("");
    setSourceUrl("");
    setParsed(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={resetAndClose} maxWidth="max-w-[580px]">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent-bg flex items-center justify-center">
            <ClipboardPaste className="w-4 h-4 text-accent" strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-bold text-[18px] text-ink">Paste Import</h2>
            <p className="text-[11px] text-ink-muted">
              Drop a recipe clipping into your collection
            </p>
          </div>
        </div>
        <button
          onClick={resetAndClose}
          className="w-8 h-8 rounded-full bg-bg-warm flex items-center justify-center hover:bg-border transition-colors"
        >
          <X className="w-4 h-4 text-ink-light" strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="px-8 py-6 space-y-4">
        {/* Text area */}
        <div>
          <label className="block font-medium text-[12px] text-ink-light mb-1.5">
            Recipe Text
          </label>
          <div className="border-2 border-dashed border-border rounded-card p-1 hover:border-accent-light transition-colors">
            <textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setParsed(null);
              }}
              placeholder="Paste your recipe here..."
              className="w-full bg-bg-warm rounded-input px-4 py-3 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none resize-none min-h-[180px]"
            />
          </div>
          {!parsed && (
            <div className="flex items-center justify-center mt-3 text-ink-muted">
              <Clipboard className="w-4 h-4 mr-2" strokeWidth={1.5} />
              <span className="text-[11px]">Paste from clipboard (Ctrl+V)</span>
            </div>
          )}
        </div>

        {/* Source URL */}
        <div>
          <label className="block font-medium text-[12px] text-ink-light mb-1.5">
            Source URL (optional)
          </label>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-bg-warm border border-border rounded-input px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Parsed preview */}
        {parsed && (
          <div className="bg-[#F8F8F5] rounded-card p-5 border border-[#E8E6E0]">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-700" strokeWidth={2} />
              <span className="font-semibold text-[13px] text-green-700">
                Recipe detected!
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-[0.04em] font-medium mb-1">
                  Name
                </p>
                <p className="font-semibold text-[14px] text-ink">{parsed.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-[0.04em] font-medium mb-1">
                  Servings
                </p>
                <p className="font-semibold text-[14px] text-ink">{parsed.servings}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-[0.04em] font-medium mb-1">
                  Prep Time
                </p>
                <p className="font-semibold text-[14px] text-ink">
                  {parsed.time || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-[0.04em] font-medium mb-1">
                  Ingredients
                </p>
                <p className="font-semibold text-[14px] text-ink">
                  {parsed.ingredients.length} items detected
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Parse button (pre-parse state) */}
        {!parsed && (
          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="w-full bg-accent text-white rounded-pill py-3 text-[13px] font-semibold hover:-translate-y-[1px] hover:shadow-button transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" strokeWidth={2} />
            Parse Recipe
          </button>
        )}
      </div>

      {/* Footer (post-parse) */}
      {parsed && (
        <div className="border-t border-border px-8 py-4 flex items-center justify-between">
          <button
            onClick={handleEditInForm}
            className="flex items-center gap-1.5 bg-transparent border border-border text-ink-light rounded-pill px-5 py-2.5 text-[12px] font-semibold hover:border-accent hover:text-accent transition-all"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            Edit in Form
          </button>
          <button
            onClick={handleConfirmSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-accent text-white rounded-pill px-5 py-2.5 text-[12px] font-semibold hover:-translate-y-[1px] hover:shadow-button transition-all disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            {saving ? "Saving..." : "Confirm & Save"}
          </button>
        </div>
      )}
    </Modal>
  );
}

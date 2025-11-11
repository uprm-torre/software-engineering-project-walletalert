import React, { useMemo, useState } from "react";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { getCategoryPresentation } from "../utils/categories";

const MAX_EMOJI_LENGTH = 3; // allow emoji plus potential variation selectors

const normalizeEmoji = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const chars = Array.from(trimmed);
  return chars.slice(0, MAX_EMOJI_LENGTH).join("");
};

const CategoriesManager = ({
  categories = [],
  onCreate,
  onDelete,
  onUpdateEmoji,
}) => {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const emojiOverrides = useMemo(() => {
    const overrides = {};
    categories.forEach((category) => {
      const key = category?.name?.trim().toLowerCase();
      if (key && category?.emoji) {
        overrides[key] = { emoji: category.emoji };
      }
    });
    return overrides;
  }, [categories]);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        })
      ),
    [categories]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmed = name.trim();
    const normalizedEmoji = normalizeEmoji(emoji);

    if (!trimmed) {
      setError("Enter a category name.");
      return;
    }

    if (categories.some((cat) => cat.name.toLowerCase() === trimmed.toLowerCase())) {
      setError("Category already exists.");
      return;
    }

    setSaving(true);
    try {
      await onCreate({
        name: trimmed,
        emoji: normalizedEmoji,
      });
      setName("");
      setEmoji("");
    } catch (err) {
      console.error("Create category error:", err?.response?.data || err.message || err);
      setError(err?.response?.data?.error || "Could not create category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    setError("");
    setDeletingId(category.id);
    try {
      await onDelete(category);
    } catch (err) {
      console.error("Delete category error:", err?.response?.data || err.message || err);
      setError(err?.response?.data?.error || "Could not delete category.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmojiUpdate = async (category) => {
    if (typeof onUpdateEmoji !== "function") return;
    setError("");
    const currentEmoji = category.emoji || "";
    const input = window.prompt(`Set emoji for ${category.name}`, currentEmoji);
    if (input === null) return;
    const normalized = normalizeEmoji(input);
    if (normalized === currentEmoji) return;
    setUpdatingId(category.id);
    try {
      await onUpdateEmoji(category, normalized);
    } catch (err) {
      console.error("Update category emoji error:", err?.response?.data || err.message || err);
      setError(err?.response?.data?.error || "Could not update emoji.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="category-manager">
      <header className="category-manager__header">
        <div>
          <h3 className="category-manager__title" id="category-manager-title">
            Manage Categories
          </h3>
          <p className="category-manager__subtitle">
            Organize your expenses with custom categories.
          </p>
        </div>
      </header>

      <section className="category-manager__form-section" aria-labelledby="category-form-title">
        <h4 id="category-form-title">Add New Category</h4>
        <form className="category-manager__form" onSubmit={handleSubmit} noValidate>
          <div className="category-manager__inputs">
            <Input
              id="category-name"
              type="text"
              placeholder="Category name (e.g., Childcare)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(error)}
              required
            />
            <Input
              id="category-emoji"
              type="text"
              className="category-manager__emoji-input"
              placeholder="😀"
              value={emoji}
              onChange={(e) => setEmoji(normalizeEmoji(e.target.value))}
              maxLength={6}
            />
            <Button type="submit" disabled={saving} aria-busy={saving} className="category-manager__add-button">
              {saving ? "Adding..." : "Add"}
            </Button>
          </div>
          {error && (
            <span className="form-error" role="alert">
              {error}
            </span>
          )}
        </form>
      </section>

      <section className="category-manager__list-section" aria-labelledby="category-list-title">
        <h4 id="category-list-title">Your Categories</h4>
        {sortedCategories.length === 0 ? (
          <div className="empty-state">
            Start organizing expenses by adding categories that match your lifestyle.
          </div>
        ) : (
          <ul className="category-list" role="list">
            {sortedCategories.map((category) => {
              const presentation = getCategoryPresentation(category.name, {
                emojiOverrides,
              });
              const activeEmoji = presentation.emoji || presentation.initials;

              return (
                <li className="category-list__item" key={category.id} role="listitem">
                  <div className="category-list__info">
                    <span
                      className="category-list__dot"
                      style={{ borderColor: `${presentation.color}33`, backgroundColor: `${presentation.color}16` }}
                    >
                      <span
                        className="category-list__emoji"
                        role="img"
                        aria-label={`${presentation.originalName} category`}
                      >
                        {activeEmoji}
                      </span>
                    </span>
                    <div className="category-list__text">
                      <span className="category-list__name">{presentation.originalName}</span>
                      <span className="category-list__meta">{presentation.label}</span>
                    </div>
                  </div>
                  <div className="category-list__actions">
                    {typeof onUpdateEmoji === "function" && (
                      <button
                        type="button"
                        className="icon-button icon-button--edit"
                        onClick={() => handleEmojiUpdate(category)}
                        disabled={updatingId === category.id}
                        title="Set emoji"
                      >
                        {updatingId === category.id ? "…" : "✏️"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="icon-button icon-button--delete"
                      onClick={() => handleDelete(category)}
                      disabled={deletingId === category.id}
                      title="Remove category"
                    >
                      {deletingId === category.id ? "…" : "🗑️"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CategoriesManager;


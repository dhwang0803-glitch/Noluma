import { Modal, Setting, App } from 'obsidian';
import { TagName } from '../domain/values/TagName';
import { t } from '../i18n';

export interface TagGroupEditResult {
  readonly canonical: string;
  readonly variants: ReadonlyArray<string>;
}

export class OrganizeTagEditModal extends Modal {
  private selectedCanonical: string;
  private selectedVariants: Set<string>;
  private customCanonical = '';
  private resolve: ((result: TagGroupEditResult | null) => void) | null = null;

  constructor(
    app: App,
    private readonly canonicalTag: TagName,
    private readonly variants: ReadonlyArray<{ tag: TagName; count: number }>,
  ) {
    super(app);
    this.selectedCanonical = canonicalTag as string;
    this.selectedVariants = new Set(
      variants.filter(v => (v.tag as string) !== (canonicalTag as string)).map(v => v.tag as string),
    );
  }

  open(): Promise<TagGroupEditResult | null> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      super.open();
    });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: t('organizeTags.editTitle') });

    // Canonical selector
    new Setting(contentEl)
      .setName(t('organizeTags.editCanonical'))
      .addDropdown(dd => {
        for (const v of this.variants) {
          dd.addOption(v.tag as string, `${v.tag as string} (${v.count})`);
        }
        dd.setValue(this.selectedCanonical);
        dd.onChange(val => { this.selectedCanonical = val; this.customCanonical = ''; });
      });

    // Custom canonical input
    new Setting(contentEl)
      .setName(t('organizeTags.editCustom'))
      .addText(text => {
        text.setPlaceholder('#custom-tag');
        text.onChange(val => {
          this.customCanonical = val.trim();
        });
      });

    // Variant checkboxes
    contentEl.createEl('h4', { text: t('organizeTags.editVariants') });
    const variantContainer = contentEl.createDiv({ cls: 'organize-tags-edit-variants' });

    for (const v of this.variants) {
      const tagStr = v.tag as string;
      const row = variantContainer.createDiv({ cls: 'organize-tags-edit-row' });
      const cb = row.createEl('input', { type: 'checkbox' }) as HTMLInputElement;
      cb.checked = this.selectedVariants.has(tagStr) || tagStr === (this.canonicalTag as string);
      cb.disabled = tagStr === this.selectedCanonical;
      row.createEl('span', { text: `${tagStr} (${v.count})` });

      cb.addEventListener('change', () => {
        if (cb.checked) {
          this.selectedVariants.add(tagStr);
        } else {
          this.selectedVariants.delete(tagStr);
        }
      });
    }

    // Buttons
    new Setting(contentEl)
      .addButton(btn =>
        btn.setButtonText(t('organizeTags.editSave'))
          .setCta()
          .onClick(() => {
            const canonical = this.customCanonical || this.selectedCanonical;
            const variants = [...this.selectedVariants].filter(v => v !== canonical);
            this.resolve?.({ canonical, variants });
            this.resolve = null;
            this.close();
          }),
      )
      .addButton(btn =>
        btn.setButtonText(t('btn.cancel'))
          .onClick(() => {
            this.resolve?.(null);
            this.resolve = null;
            this.close();
          }),
      );
  }

  onClose(): void {
    this.resolve?.(null);
    this.resolve = null;
    this.contentEl.empty();
  }
}

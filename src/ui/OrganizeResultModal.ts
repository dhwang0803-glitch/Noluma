import { App, ButtonComponent, Modal, Notice } from 'obsidian';
import { OrganizeResult } from '../domain/models/OrganizeModels';
import { NotePath } from '../domain/values/NotePath';
import { t } from '../i18n';

export interface OrganizeApplyActions {
  applyTags(notePath: NotePath, tags: string[]): Promise<void>;
  addLinks(notePath: NotePath, links: NotePath[]): Promise<void>;
  moveNote(notePath: NotePath, targetFolder: string): Promise<void>;
}

export class OrganizeResultModal extends Modal {
  constructor(
    app: App,
    private readonly notePath: NotePath,
    private readonly result: OrganizeResult,
    private readonly actions: OrganizeApplyActions,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('knowledge-maintenance-organize-result');

    contentEl.createEl('h2', { text: t('organize.title') });

    const noteName = (this.notePath as string).split('/').pop()?.replace('.md', '') ?? '';
    contentEl.createEl('p', {
      text: noteName,
      cls: 'organize-note-name',
    });

    this.renderCategory(contentEl);
    if (this.result.summary) {
      this.renderSummary(contentEl);
    }
    this.renderTags(contentEl);
    this.renderLinks(contentEl);
    this.renderMove(contentEl);

    const footer = contentEl.createDiv('organize-footer');
    new ButtonComponent(footer)
      .setButtonText(t('btn.close'))
      .onClick(() => this.close());
  }

  private renderCategory(container: HTMLElement): void {
    const section = container.createDiv('organize-section');
    section.createEl('h4', { text: t('organize.category') });
    const badge = section.createEl('span', {
      text: this.result.classifiedCategory,
      cls: 'organize-category-badge',
    });
    badge.setAttribute('data-category', this.result.classifiedCategory);
  }

  private renderSummary(container: HTMLElement): void {
    const section = container.createDiv('organize-section');
    section.createEl('h4', { text: t('organize.summary') });
    section.createEl('p', {
      text: this.result.summary,
      cls: 'organize-summary-text',
    });
  }

  private renderTags(container: HTMLElement): void {
    const section = container.createDiv('organize-section');
    const header = section.createDiv('organize-section-header');
    header.createEl('h4', { text: t('organize.suggestedTags') });

    const tags = this.result.addedTags.map(tag => tag as string);

    if (tags.length === 0) {
      section.createEl('p', {
        text: t('organize.noTags'),
        cls: 'organize-empty',
      });
      return;
    }

    const tagContainer = section.createDiv('organize-tag-list');
    for (const tag of tags) {
      tagContainer.createEl('span', { text: `#${tag}`, cls: 'organize-tag' });
    }

    new ButtonComponent(header)
      .setButtonText(t('organize.applyTags'))
      .setCta()
      .onClick(async (e) => {
        const btn = (e.target as HTMLElement).closest('button');
        try {
          await this.actions.applyTags(this.notePath, tags);
          new Notice(t('organize.tagsApplied', { count: String(tags.length) }));
          if (btn) {
            btn.setText(t('maintenance.applied'));
            btn.setAttribute('disabled', 'true');
            btn.addClass('organize-applied');
          }
        } catch (err) {
          new Notice(t('notice.actionFailed', { error: err instanceof Error ? err.message : String(err) }));
        }
      });
  }

  private renderLinks(container: HTMLElement): void {
    const section = container.createDiv('organize-section');
    const header = section.createDiv('organize-section-header');
    header.createEl('h4', { text: t('organize.suggestedLinks') });

    const links = this.result.suggestedLinks;

    if (links.length === 0) {
      section.createEl('p', {
        text: t('organize.noLinks'),
        cls: 'organize-empty',
      });
      return;
    }

    const linkList = section.createEl('ul', { cls: 'organize-link-list' });
    for (const link of links) {
      const linkPath = (link as string).replace('.md', '');
      linkList.createEl('li', { text: `[[${linkPath}]]` });
    }

    new ButtonComponent(header)
      .setButtonText(t('organize.addLinks'))
      .setCta()
      .onClick(async (e) => {
        const btn = (e.target as HTMLElement).closest('button');
        try {
          await this.actions.addLinks(this.notePath, [...links]);
          new Notice(t('organize.linksAdded', { count: String(links.length) }));
          if (btn) {
            btn.setText(t('maintenance.applied'));
            btn.setAttribute('disabled', 'true');
            btn.addClass('organize-applied');
          }
        } catch (err) {
          new Notice(t('notice.actionFailed', { error: err instanceof Error ? err.message : String(err) }));
        }
      });
  }

  private renderMove(container: HTMLElement): void {
    const section = container.createDiv('organize-section');
    const header = section.createDiv('organize-section-header');
    header.createEl('h4', { text: t('organize.suggestedMove') });

    const target = this.result.suggestedMoveTarget;

    if (!target) {
      section.createEl('p', {
        text: t('organize.noMove'),
        cls: 'organize-empty',
      });
      return;
    }

    section.createEl('p', {
      text: `${t('organize.moveTo')}: ${target}/`,
      cls: 'organize-move-target',
    });

    new ButtonComponent(header)
      .setButtonText(t('organize.moveNote'))
      .setWarning()
      .onClick(async () => {
        try {
          await this.actions.moveNote(this.notePath, target);
          new Notice(t('organize.noteMoved', { folder: target }));
          this.close();
        } catch (err) {
          new Notice(t('notice.actionFailed', { error: err instanceof Error ? err.message : String(err) }));
        }
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

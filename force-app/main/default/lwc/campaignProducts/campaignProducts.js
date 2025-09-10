import { LightningElement, api, track } from 'lwc';
import getProducts from '@salesforce/apex/ProductService.getProducts';
import getSelectedProductCodes from '@salesforce/apex/ProductLinkService.getSelectedProductCodes';
import syncSelectedProducts from '@salesforce/apex/ProductLinkService.syncSelectedProducts';

const DEBOUNCE_MS = 200;
const MAX_VISIBLE = 200;
const MAX_SELECTED = 3;

export default class CampaignProducts extends LightningElement {
    @api recordId;

    @track loading = true;
    @track saving = false;
    @track message = '';

    allOptions = [];
    labelByValue = new Map();
    valueSet = new Set();
    query = '';

    filteredOptions = [];
    filteredCount = 0;
    maxVisible = MAX_VISIBLE;

    async connectedCallback() {
        await this.loadProducts();
        await this.loadExisting();
    }

    async loadProducts() {
        this.loading = true;
        try {
            const data = await getProducts();
            this.allOptions = (data || []).map(p => ({ label: p.label, value: p.id, labelLower: (p.label||'').toLowerCase() }));
            this.labelByValue = new Map(this.allOptions.map(o => [o.value, o.label]));
            this.refreshDerived();
        } catch (e) {
            this.message = 'Failed to load products, check endpoint.';
            // eslint-disable-next-line no-console
            console.error(e);
        } finally {
            this.loading = false;
        }
    }

    async loadExisting() {
        if (!this.recordId) return;
        try {
            const codes = await getSelectedProductCodes({ campaignId: this.recordId });
            this.valueSet = new Set(codes || []);
            this.refreshDerived();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    }

    get hasSelection() { return this.valueSet.size > 0; }
    get selectedCount() { return this.valueSet.size; }
    get selectedPills() {
        return Array.from(this.valueSet).map(v => ({ value: v, label: this.labelByValue.get(v) || v }));
    }
    get showTruncationNote() { return this.filteredCount > this.filteredOptions.length; }

    refreshDerived() {
        const q = (this.query || '').toLowerCase().trim();
        let list = this.allOptions;
        if (q) list = list.filter(o => o.labelLower.includes(q));
        this.filteredCount = list.length;
        const sliced = list.slice(0, MAX_VISIBLE);
        this.filteredOptions = sliced.map(o => ({ label: o.label, value: o.value, checked: this.valueSet.has(o.value) }));
    }

    debounceId;
    handleSearchInput(evt) {
        const val = evt.target.value || '';
        this.query = val;
        clearTimeout(this.debounceId);
        this.debounceId = setTimeout(() => { this.refreshDerived(); }, DEBOUNCE_MS);
    }

    handleToggleCheckbox(evt) {
        const v = evt.currentTarget.dataset.value;
        const checked = evt.target.checked;
        if (checked) {
            if (this.valueSet.size >= MAX_SELECTED) {
                evt.target.checked = false;
                this.message = 'You can select up to 3 products.';
                return;
            }
            this.valueSet.add(v);
        } else {
            this.valueSet.delete(v);
        }
        this.refreshDerived();
        this.message = '';
    }

    handleSelectAllVisible() {
        for (const opt of this.filteredOptions) {
            if (this.valueSet.size >= MAX_SELECTED) break;
            if (!this.valueSet.has(opt.value)) this.valueSet.add(opt.value);
        }
        if (this.valueSet.size >= MAX_SELECTED) {
            this.message = 'Limit reached: 3 products.';
        }
        this.refreshDerived();
    }

    handleClearVisible() {
        for (const opt of this.filteredOptions) this.valueSet.delete(opt.value);
        this.refreshDerived();
    }

    handleRemovePill(evt) {
        const v = evt.detail.name;
        this.valueSet.delete(v);
        this.refreshDerived();
    }

    handleReset() {
        this.valueSet = new Set();
        this.refreshDerived();
        this.message = '';
    }

    async handleSave() {
        if (!this.recordId) {
            this.message = 'No Campaign Id found. Place this on a Campaign record page.';
            return;
        }
        this.saving = true; this.message = '';
        try {
            const arr = Array.from(this.valueSet);
            await syncSelectedProducts({ campaignId: this.recordId, selectedCodes: arr });
            this.message = 'Saved. Campaign Products related list updated.';
        } catch (e) {
            this.message = 'Save failed, see console.';
            // eslint-disable-next-line no-console
            console.error(e);
        } finally {
            this.saving = false;
        }
    }
}
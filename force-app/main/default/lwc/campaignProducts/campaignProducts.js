import { LightningElement, api, track, wire } from 'lwc';
import getProducts from '@salesforce/apex/ProductService.getProducts';
import saveCampaignProducts from '@salesforce/apex/ProductService.saveCampaignProducts';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import PRODUCTS_FIELD from '@salesforce/schema/Campaign.Products__c';

const DEBOUNCE_MS = 200;
const MAX_VISIBLE = 200;

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

    @wire(getRecord, { recordId: '$recordId', fields: [PRODUCTS_FIELD] })
    wiredCampaign({ data, error }) {
        if (data) {
            const raw = getFieldValue(data, PRODUCTS_FIELD) || '';
            const vals = raw ? raw.split(';').filter(Boolean) : [];
            this.valueSet = new Set(vals);
            this.refreshDerived();
        } else if (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }

    connectedCallback() {
        this.loadProducts();
    }

    async loadProducts() {
        this.loading = true;
        try {
            const data = await getProducts();
            this.allOptions = (data || []).map(p => ({
                label: p.label,
                value: p.id,
                labelLower: (p.label || '').toLowerCase()
            }));
            this.labelByValue = new Map(this.allOptions.map(o => [o.value, o.label]));
            this.refreshDerived();
        } catch (e) {
            this.message = 'Failed to load products, check Named Credential or endpoint.';
            // eslint-disable-next-line no-console
            console.error(e);
        } finally {
            this.loading = false;
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
        if (checked) this.valueSet.add(v); else this.valueSet.delete(v);
        this.refreshDerived();
        this.message = '';
    }

    handleSelectAllVisible() {
        for (const opt of this.filteredOptions) this.valueSet.add(opt.value);
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
        if (!this.recordId) { this.message = 'No Campaign Id found. Place this component on a Campaign record page.'; return; }
        this.saving = true;
        this.message = '';
        try {
            const arr = Array.from(this.valueSet);
            await saveCampaignProducts({ campaignId: this.recordId, selectedIds: arr });
            this.message = 'Saved. Selected products stored on the Campaign.';
        } catch (e) {
            this.message = 'Save failed, see console.';
            // eslint-disable-next-line no-console
            console.error(e);
        } finally {
            this.saving = false;
        }
    }
}

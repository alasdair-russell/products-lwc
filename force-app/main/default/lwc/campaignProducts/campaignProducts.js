import { LightningElement, api, track, wire } from 'lwc';
import getProducts from '@salesforce/apex/ProductService.getProducts';
import saveCampaignProducts from '@salesforce/apex/ProductService.saveCampaignProducts';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import PRODUCTS_FIELD from '@salesforce/schema/Campaign.Products__c';

export default class CampaignProducts extends LightningElement {
    @api recordId;
    @track options = [];
    @track value = [];
    @track saving = false;
    @track message = '';

    @wire(getRecord, { recordId: '$recordId', fields: [PRODUCTS_FIELD] })
    wiredCampaign({ data, error }) {
        if (data) {
            const raw = getFieldValue(data, PRODUCTS_FIELD) || '';
            this.value = raw ? raw.split(';').filter(Boolean) : [];
        } else if (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }

    connectedCallback() { this.loadProducts(); }

    async loadProducts() {
        try {
            const data = await getProducts();
            this.options = (data || []).map(p => ({ label: p.label, value: p.id }));
        } catch (e) {
            this.message = 'Failed to load products, check Named Credential or Remote Site Settings.';
            // eslint-disable-next-line no-console
            console.error(e);
        }
    }

    handleChange(event) { this.value = event.detail.value; this.message=''; }
    handleReset() { this.value = []; this.message=''; }

    async handleSave() {
        if (!this.recordId) { this.message = 'No Campaign Id found. Place this component on a Campaign record page.'; return; }
        this.saving = true; this.message = '';
        try {
            await saveCampaignProducts({ campaignId: this.recordId, selectedIds: this.value });
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
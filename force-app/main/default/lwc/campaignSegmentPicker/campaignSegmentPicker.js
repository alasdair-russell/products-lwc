import { LightningElement, api, track, wire } from 'lwc';
import getSegments from '@salesforce/apex/SegmentService.getSegments';
import saveCampaignSegment from '@salesforce/apex/SegmentService.saveCampaignSegment';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import SEGMENT_ID_FIELD from '@salesforce/schema/Campaign.DataCloud_Segment_Id__c';
import SEGMENT_NAME_FIELD from '@salesforce/schema/Campaign.DataCloud_Segment_Name__c';

const DEBOUNCE_MS = 200;
const MAX_VISIBLE = 200;

export default class CampaignSegmentPicker extends LightningElement {
    @api recordId;

    @track loading = true;
    @track saving = false;
    @track message = '';

    all = [];
    query = '';
    maxVisible = MAX_VISIBLE;

    selectedId;
    selectedName;

    filtered = [];
    filteredCount = 0;

    @wire(getRecord, { recordId: '$recordId', fields: [SEGMENT_ID_FIELD, SEGMENT_NAME_FIELD] })
    wiredCampaign({ data, error }) {
        if (data) {
            const sid = getFieldValue(data, SEGMENT_ID_FIELD) || '';
            const sname = getFieldValue(data, SEGMENT_NAME_FIELD) || '';
            this.selectedId = sid;
            this.selectedName = sname;
            this.refresh();
        } else if (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }

    connectedCallback() { this.load(); }

    async load() {
        this.loading = true;
        try {
            const env = await getSegments();
            const list = (env || []).map(s => ({ id: s.id, name: s.name, description: s.description || '' }));
            this.all = list;
            this.refresh();
        } catch (e) {
            this.message = 'Failed to load segments, check the SegmentsAPI Named Credential or JSON file.';
            // eslint-disable-next-line no-console
            console.error(e);
        } finally {
            this.loading = false;
        }
    }

    get showTruncationNote() { return this.filteredCount > this.filtered.length; }

    refresh() {
        const q = (this.query || '').toLowerCase().trim();
        let list = this.all;
        if (q) {
            list = list.filter(x =>
                (x.name || '').toLowerCase().includes(q) ||
                (x.description || '').toLowerCase().includes(q) ||
                (x.id || '').toLowerCase().includes(q)
            );
        }
        this.filteredCount = list.length;
        const sliced = list.slice(0, MAX_VISIBLE);
        this.filtered = sliced.map(x => ({ ...x, checked: x.id === this.selectedId }));
    }

    debounceId;
    handleSearchInput(evt) {
        this.query = evt.target.value || '';
        clearTimeout(this.debounceId);
        this.debounceId = setTimeout(() => this.refresh(), DEBOUNCE_MS);
    }

    handlePick(evt) {
        this.selectedId = evt.currentTarget.dataset.id;
        this.selectedName = evt.currentTarget.dataset.name;
        this.refresh();
        this.message = '';
    }

    handleClear() {
        this.selectedId = undefined;
        this.selectedName = undefined;
        this.refresh();
        this.message = '';
    }

    async handleSave() {
        if (!this.recordId) { this.message = 'No Campaign Id found. Place this component on a Campaign record page.'; return; }
        if (!this.selectedId) { this.message = 'Pick a segment first.'; return; }
        this.saving = true; this.message = '';
        try {
            await saveCampaignSegment({ campaignId: this.recordId, segmentId: this.selectedId, segmentName: this.selectedName });
            this.message = `Saved segment ${this.selectedName || this.selectedId} to Campaign.`;
        } catch (e) {
            this.message = 'Save failed, see console.';
            // eslint-disable-next-line no-console
            console.error(e);
        } finally {
            this.saving = false;
        }
    }
}

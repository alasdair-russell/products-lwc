public with sharing class ProductLinkService {
    public class ProductDTO { @AuraEnabled public String id; @AuraEnabled public String label; }

    @AuraEnabled(cacheable=true)
    public static List<String> getSelectedProductCodes(Id campaignId) {
        if (campaignId == null) return new List<String>();
        List<CampaignProduct__c> links = [SELECT Id, Product__r.ProductCode FROM CampaignProduct__c WHERE Campaign__c = :campaignId];
        List<String> out = new List<String>();
        for (CampaignProduct__c l : links) {
            if (l.Product__r != null) out.add(l.Product__r.ProductCode);
        }
        return out;
    }

    @AuraEnabled
    public static void syncSelectedProducts(Id campaignId, List<String> selectedCodes) {
        if (campaignId == null) throw new AuraHandledException('Missing campaign Id');
        if (selectedCodes == null) selectedCodes = new List<String>();
        while (selectedCodes.size() > 3) selectedCodes.remove(3);

        List<CampaignProduct__c> existing = [SELECT Id, Product__c, Product__r.ProductCode FROM CampaignProduct__c WHERE Campaign__c = :campaignId];
        Map<String, CampaignProduct__c> existingByCode = new Map<String, CampaignProduct__c>();
        for (CampaignProduct__c cp : existing) {
            if (cp.Product__r != null) existingByCode.put(cp.Product__r.ProductCode, cp);
        }

        Set<String> codeSet = new Set<String>(selectedCodes);
        Map<String, Product2> byCode = new Map<String, Product2>();
        if (!codeSet.isEmpty()) {
            for (Product2 p : [SELECT Id, ProductCode FROM Product2 WHERE ProductCode IN :codeSet]) {
                byCode.put(p.ProductCode, p);
            }
        }

        Map<String, String> labelById = new Map<String, String>();
        try {
            List<ProductLinkService.ProductDTO> fromJson = ProductService.getProducts();
            for (ProductLinkService.ProductDTO d : fromJson) labelById.put(d.id, d.label);
        } catch (Exception e) {
        }

        List<Product2> toInsertProducts = new List<Product2>();
        for (String code : codeSet) {
            if (!byCode.containsKey(code)) {
                Product2 p = new Product2();
                p.Name = labelById.containsKey(code) ? labelById.get(code) : code;
                p.ProductCode = code;
                p.IsActive = true;
                toInsertProducts.add(p);
            }
        }
        if (!toInsertProducts.isEmpty()) {
            insert toInsertProducts;
            for (Product2 p : toInsertProducts) byCode.put(p.ProductCode, p);
        }

        Map<String, Id> desiredIdsByCode = new Map<String, Id>();
        for (String code : selectedCodes) {
            Product2 p = byCode.get(code);
            if (p != null) desiredIdsByCode.put(code, p.Id);
        }

        List<CampaignProduct__c> toInsert = new List<CampaignProduct__c>();
        List<CampaignProduct__c> toDelete = new List<CampaignProduct__c>();

        for (String code : desiredIdsByCode.keySet()) {
            if (!existingByCode.containsKey(code)) {
                toInsert.add(new CampaignProduct__c(Campaign__c = campaignId, Product__c = desiredIdsByCode.get(code)));
            }
        }
        for (String code : existingByCode.keySet()) {
            if (!desiredIdsByCode.containsKey(code)) {
                toDelete.add(existingByCode.get(code));
            }
        }

        if (!toInsert.isEmpty()) insert toInsert;
        if (!toDelete.isEmpty()) delete toDelete;
    }
}
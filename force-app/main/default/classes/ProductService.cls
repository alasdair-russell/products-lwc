public with sharing class ProductService {
    public class ProductDTO { @AuraEnabled public String id; @AuraEnabled public String label; }
    public class ProductsEnvelope { public List<ProductDTO> products; }

    private static final String NC_NAME = 'ProductsAPI';
    private static final String PATH = '';

    @AuraEnabled(cacheable=true)
    public static List<ProductDTO> getProducts() {
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setMethod('GET');
        req.setEndpoint('callout:' + NC_NAME + PATH);
        HttpResponse res = http.send(req);
        if (res.getStatusCode() >= 200 && res.getStatusCode() < 300) {
            ProductsEnvelope env = (ProductsEnvelope) JSON.deserialize(res.getBody(), ProductsEnvelope.class);
            if (env == null || env.products == null) return new List<ProductDTO>();
            return env.products;
        }
        throw new AuraHandledException('Failed to load products, status ' + res.getStatus());
    }

    @AuraEnabled
    public static void saveCampaignProducts(Id campaignId, List<String> selectedIds) {
        if (campaignId == null) throw new AuraHandledException('Missing campaign Id');
        String value = (selectedIds == null || selectedIds.isEmpty()) ? '' : String.join(selectedIds, ';');
        Campaign c = new Campaign(Id = campaignId);
        c.Products__c = value;
        update c;
    }
}
# Searchable multi-select UI patch

Replace the dual listbox with a custom searchable UI.

Updated files:
- force-app/main/default/lwc/campaignProducts/campaignProducts.html
- force-app/main/default/lwc/campaignProducts/campaignProducts.js
- force-app/main/default/lwc/campaignProducts/campaignProducts.css (new)

Deploy:
sf project deploy start --sourcepath force-app/main/default/lwc/campaignProducts -o <org>

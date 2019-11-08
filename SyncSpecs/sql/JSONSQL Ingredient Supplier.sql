SELECT JT.*
FROM specifications spec, 
json_table(spec.json_document, '$.productSpecificationFullDTO[*]' 
    COLUMNS (
            SpecNumber varchar2 PATH '$.specNumber[0]',
            SpecVersion varchar2 PATH '$.specVersion[0]',
            Title varchar2 PATH '$.title[0]',
            Legislation varchar2 PATH '$.legislationText[0]',
            Supplier VARCHAR2 PATH '$.supplier[0].name[0]',
            NESTED PATH '$.productSpecificationStatus[0].localeData[*]'
            COLUMNS (
                Status varchar2 PATH '$.description[0]',
                Langue varchar2 PATH '$.locale[0]',
                StatusId varchar2 PATH '$.locale[0]'
                ),
            IsDeleted varchar2 PATH '$.deleted[0]',
            IsActive  varchar2 PATH '$.specTypeFormat[0].isActive[0]',
            PrimarySite varchar2 PATH '$.primarySites[0].site[0].name[0]',
            NESTED PATH '$.specTypeFormat[*]'
            COLUMNS (
                SpecificationType VARCHAR2 PATH '$.specType[*]'
            ),
            NESTED PATH '$.specificationSectionDetail[*].specificationSectionFoodRecipeAndRawMaterialsSection[*].recipeItem[*].rawMaterialItem[*]'
            COLUMNS (
                RMId VARCHAR2 PATH '$.id[0]',
                RMSupplier VARCHAR2 PATH '$.supplier[0]',
                RMSupplierLocation VARCHAR2 PATH '$.supplierLocation[0]',
                RMCountryofOrigin varchar2 PATH '$.countryOfOrigin[0].code[0]',
                RMCountryofProcessing varchar2 PATH '$.countryWhereProcessed[0].code[0]'
            ) 
    )
) as "JT"
WHERE nvl(Langue,'fr')='fr';
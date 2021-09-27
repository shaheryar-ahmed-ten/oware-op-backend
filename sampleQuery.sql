select
    PI.customerId,
    PI.warehouseId,
    PI.productId,
    Product.name as product,
    UOM.name as uom,
    Warehouse.name as warehouse,
    Customer.companyName as customer,
    COALESCE(SUM(PI.quantity), 0) as quantity,
    COALESCE(SUM(DO.quantity), 0) as committedQuantity
    from ProductInwards as PI
    LEFT JOIN (SELECT customerId, productId, warehouseId, sum(quantity) as quantity
    FROM DispatchOrders
    WHERE customerId=PI.customerId AND productId=PI.productId AND warehouseId=PI.warehouseId)
    as DO on
    PI.productId=DO.productId AND
    PI.warehouseId=DO.warehouseId AND
    PI.customerId=DO.customerId
    
    LEFT JOIN Products as Product ON PI.productId=Product.id
    LEFT JOIN Warehouses as Warehouse ON PI.warehouseId=Warehouse.id
    LEFT JOIN Customers as Customer ON PI.customerId=Customer.id
    LEFT JOIN UOMs as UOM ON Product.uomId=UOM.id
group by PI.customerId, PI.productId, PI.warehouseId;

INSERT INTO WastagesTypes VALUES (1,"DAMAGED",CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP(),null),(2,"EXPIRED",CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP(),null),(3,"STOLEN",CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP(),null),(4,"OTHER",CURRENT_TIMESTAMP(),CURRENT_TIMESTAMP(),null);

update ProductInwards set internalIdForBusiness = concat('PI-',(select * from(
	select w.businessWarehouseCode from Warehouses w 
	inner join ProductInwards pi2 on w.id = pi2.warehouseId 
	where pi2.id = ProductInwards.id
)tblTmp),'-')
update ProductInwards set internalIdForBusiness = CONCAT(internalIdForBusiness,LPAD(id,6,'0')) 
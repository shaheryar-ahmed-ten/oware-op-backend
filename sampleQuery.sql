select PI.customerId,
    PI.warehouseId,
    PI.productId,
    Product.name as product,
    UOM.name as uom,
    Warehouse.name as warehouse,
    Customer.companyName as customer,
    COALESCE(SUM(PI.quantity), 0) as quantity,
    COALESCE(SUM(DO.quantity), 0) as committedQuantity,
    COALESCE(SUM(PO.quantity), 0) as dispatchedQuantity
    from ProductInwards as PI
    LEFT JOIN DispatchOrders as DO
    ON PI.customerId = DO.customerId
    AND PI.warehouseId = DO.warehouseId
    AND PI.productId = DO.productId
    LEFT JOIN ProductOutwards as PO on PO.dispatchOrderId = DO.id
    LEFT JOIN Products as Product ON PI.productId=Product.id
    LEFT JOIN Warehouses as Warehouse ON PI.warehouseId=Warehouse.id
    LEFT JOIN Customers as Customer ON PI.customerId=Customer.id
    LEFT JOIN UOMs as UOM ON Product.uomId=UOM.id
group by PI.customerId, PI.productId, PI.warehouseId
;
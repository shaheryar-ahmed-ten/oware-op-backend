const moment = require('moment')
const { Inventory, ProductInward, OutboundStat, InboundStat, sequelize, Product } = require('../models')
const { Op, where, Sequelize } = require('sequelize');

exports.customerStatistics = async (companyId) => {
  const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");;
  const previousDate = moment().subtract(7, 'days');
  const formattedPreviousDate = previousDate.format("YYYY-MM-DD HH:mm:ss");
  const whereClauseWithDate = dateKey => ({ customerId: companyId, [dateKey]: { [Op.between]: [previousDate, currentDate] } });
  const whereClauseWithoutDate = { customerId: companyId };
  const whereClauseForStorageDetails = {
    customerId: companyId, availableQuantity: {
      [Op.ne]: 0
    }
  }

  const inboundStats = {
    total: await InboundStat.aggregate('id', 'count', {
      where: whereClauseWithDate('createdAt')
    }),
    ...(await sequelize.query(`
    select sum(weight*InwardGroups.quantity) as weight,
    sum(dimensionsCBM*InwardGroups.quantity) as dimensionsCBM 
    from InwardGroups 
    join ProductInwards as ProductInwards on inwardId = ProductInwards.id 
    join Products as Products on Products.id = InwardGroups.productId where customerId = ${req.companyId} 
    and (ProductInwards.createdAt BETWEEN '${formattedPreviousDate}' AND '${currentDate}') 
    `, {
      plain: true
    }))
  }

  const outboundStats = {
    total: await OutboundStat.aggregate('id', 'count', {
      distinct: true,
      where: whereClauseWithDate('createdAt')
    }),
    weight: await OutboundStat.aggregate('weight', 'sum', {
      where: whereClauseWithDate('createdAt')
    }),
    dimensionsCBM: await OutboundStat.aggregate('dimensionsCBM', 'sum', {
      where: whereClauseWithDate('createdAt')
    })
  }

  const generalStats = {
    products: await Inventory.aggregate('productId', 'count', {
      distinct: true,
      where: whereClauseForStorageDetails
    }),
    ...(await sequelize.query(`
      select sum(Products.weight) as weight, sum(Products.dimensionsCBM) as dimensionsCBM
      from Inventories left join Products on Products.id = Inventories.productId
      where availableQuantity > 0 and customerId = ${companyId} group by customerId;;
    `, { plain: true })),
    ...(await sequelize.query(`
    select count(*) as pendingOrders from
    (select dispatchOrderId as id,
      count(id) as totalOutwards,
      dispatchOrderQuantity > sum(productOutwardQuantity) as isPendingOrder
      from OutboundQueryForPending where customerId = ${companyId} group by dispatchOrderId)
      as orders where isPendingOrder = 1;
    `, {
      plain: true
    }))
  };

  const calculatingFastestMoving = await Inventory.findAll({
    group: ['productId'],
    plain: false,
    where: whereClauseWithDate,
    raw: true,
    attributes: [
      ['productId', 'dispatchedQuantity'],
      [Sequelize.fn('max', Sequelize.col('dispatchedQuantity')), 'maximum'],
    ],
    include: [{ model: Product, attributes: ['name'] }]
  })
  const fastestMovingProduct = calculatingFastestMoving[0]


  return ({
    inboundStats, currentStats: generalStats, outboundStats, fastestMovingProduct
  });
};


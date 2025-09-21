const { getAllShopItemsHandler, deleteShopItemByIdHandler, getShopItemByIdHandler } = require("./handler");

const routes = [
    {
        method: 'GET',
        path: '/shopItems',
        handler: getAllShopItemsHandler,
    },
    {
        method: 'GET',
        path: '/shopItems/{id}',
        handler: getShopItemByIdHandler,
    },
    {
        method: 'DELETE',
        path: '/shopItems/{id}',
        handler: deleteShopItemByIdHandler,
    },
];

module.exports = routes;
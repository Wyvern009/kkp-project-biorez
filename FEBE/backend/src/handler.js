const shopItems = require("./shop");

const getAllShopItemsHandler = () => ({
  status: "success",
  data: {
    shopItems,
  },
});

const getShopItemByIdHandler = (request, h) => {
  const { id } = request.params;

  const shopItem = shopItems.filter((n) => n.id === id)[0];

  if (shopItem !== undefined) {
    return {
      status: "success",
      data: {
        shopItem,
      },
    };
  }

  const response = h.response({
    status: "fail",
    message: "Pesanan tidak ditemukan",
  });
  response.code(404);
  return response;
};

const deleteShopItemByIdHandler = (request, h) => {
  const { id } = request.params;

  const index = shopItems.findIndex((item) => item.id === id);

  if (index !== -1) {
    shopItems.splice(index, 1);
    const response = h.response({
      status: 'success',
      message: 'Pesanan berhasil dihapus',
    });
    response.code(200);
    return response;
  }

  const response = h.response({
    status: 'fail',
    message: 'Catatan gagal dihapus.',
  });
  response.code(404);
  return response;
};

module.exports = { getAllShopItemsHandler, deleteShopItemByIdHandler, getShopItemByIdHandler }
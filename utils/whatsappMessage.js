exports.createWhatsappMessage = (order) => {
  let message = `🛒 New Order\n\n`;

  order.products.forEach((item, index) => {
    message += `${index + 1}. ${item.name} x ${item.quantity}\n`;
  });

  message += `\nTotal: Rs ${order.totalPrice}`;

  return message;
};

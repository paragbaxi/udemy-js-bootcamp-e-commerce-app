const express = require('express');

const cartsRepo = require('../repositories/carts');
const productsRepo = require('../repositories/products');
const cartShowTemplate = require('../views/carts/show');

const router = express.Router();

router.post('/cart/products/', async (req, res) => {
    // figure out cart
    let cart;
    if (!req.session.cartId) {
        // We don't have a cart, we need to create one,
        // and store the cart id on the req.session.cartId
        // property
        cart = await cartsRepo.create({ items: [] });
        req.session.cartId = cart.id;
    } else {
        // We have a cart! let's get it form the cartRepo
        cart = await cartsRepo.getOne(req.session.cartId);
    }

    const existingItem = cart.items.find(
        (item) => item.id === req.body.productId
    );
    if (existingItem) {
        // increment quantity for existing product
        existingItem.quantity++;
    } else {
        // add new product to items array
        cart.items.push({ id: req.body.productId, quantity: 1 });
    }
    await cartsRepo.update(req.session.cartId, { items: cart.items });
    res.redirect('/cart');
});

router.get('/cart', async (req, res) => {
    // if no cart, create cart
    let cart;
    if (!req.session.cartId) {
        cart = await cartsRepo.create({ items: [] });
        req.session.cartId = cart.id;
    } else {
        cart = await cartsRepo.getOne(req.session.cartId);
    }

    for (let item of cart.items) {
        const product = await productsRepo.getOne(item.id);
        item.product = product;
    }
    res.send(cartShowTemplate({ items: cart.items }));
});

router.post('/cart/products/delete', async (req, res) => {
    const { itemId } = req.body;
    const cart = await cartsRepo.getOne(req.session.cartId);

    const items = cart.items.filter((item) => item.id !== itemId);
    await cartsRepo.update(req.session.cartId, { items });
    res.redirect('/cart');
});

module.exports = router;

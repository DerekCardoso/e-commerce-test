import axios from 'axios';

const PRODUCT_API = 'https://empreender.nyc3.cdn.digitaloceanspaces.com/static/teste-prod-1.json'
const CHECKOUT_API = 'https://app.landingpage.com.br/api/checkoutloja/LPL2gc/5d87eb644e5631bc6a03f1e43a804e1c'

export const getProduct = async () => {
    const res = await axios.get(PRODUCT_API);
    return res.data;
}

export const sendCheckout = async (checkoutData) => {
    const res = await axios.post(CHECKOUT_API, checkoutData)
    return res.data;
}
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

import Layout from "@/components/Layout";
import Button from "@/components/Button";
import { useAuth } from "@/firebase/context";
import { useAddresses } from "hooks/address.hook";
import { useCheckoutCart } from "hooks/checkout.hook";
import { createOrder } from "@/firebase/orders";
import {
  validateCardNumber,
  validateExpiry,
  validateCVV,
  getCardType,
  formatCardNumber,
  formatExpiry,
} from "@/utils/validation";

import styles from "./checkout.module.scss";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: addresses, loading: addressLoading } = useAddresses();
  const { items, subtotal, loading: cartLoading } = useCheckoutCart();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review

  const shippingCost = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shippingCost;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (addresses?.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0].id);
    }
  }, [addresses]);

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (name === "expiry") {
      formattedValue = formatExpiry(value);
    } else if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setPaymentData((prev) => ({ ...prev, [name]: formattedValue }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validatePayment = () => {
    const newErrors = {};
    const cardType = getCardType(paymentData.cardNumber);

    if (!validateCardNumber(paymentData.cardNumber)) {
      newErrors.cardNumber = "Invalid card number";
    }
    if (!paymentData.cardName.trim()) {
      newErrors.cardName = "Cardholder name is required";
    }
    if (!validateExpiry(paymentData.expiry)) {
      newErrors.expiry = "Invalid expiry date";
    }
    if (!validateCVV(paymentData.cvv, cardType)) {
      newErrors.cvv = "Invalid CVV";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && !selectedAddress) {
      setErrors({ address: "Please select a delivery address" });
      return;
    }
    if (step === 2 && !validatePayment()) {
      return;
    }
    setStep(step + 1);
  };

  const handlePlaceOrder = async () => {
    if (processing) return;
    setProcessing(true);

    try {
      const orderId = await createOrder({
        products: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          size: item.size,
          quantity: item.quantity,
        })),
        address: selectedAddress,
        paymentMethod: {
          type: getCardType(paymentData.cardNumber),
          last4: paymentData.cardNumber.slice(-4),
        },
        totalPrice: total,
        shippingCost,
      });

      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (error) {
      console.error("Order failed:", error);
      setErrors({ submit: "Failed to place order. Please try again." });
      setProcessing(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <Layout noCategories>
        <div className={styles.container}>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout noCategories>
        <div className={styles.container}>
          <h1>Your cart is empty</h1>
          <Button onClick={() => router.push("/")}>Continue Shopping</Button>
        </div>
      </Layout>
    );
  }

  const selectedAddressData = addresses?.find((a) => a.id === selectedAddress);

  return (
    <Layout noCategories>
      <Head>
        <title>Checkout</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.steps}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
            1. Shipping
          </div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
            2. Payment
          </div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ""}`}>
            3. Review
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.main}>
            {step === 1 && (
              <div className={styles.section}>
                <h2>Select Delivery Address</h2>
                {addressLoading ? (
                  <p>Loading addresses...</p>
                ) : addresses?.length === 0 ? (
                  <div>
                    <p>No addresses found.</p>
                    <Button onClick={() => router.push("/account/addresses")}>
                      Add Address
                    </Button>
                  </div>
                ) : (
                  <div className={styles.addressList}>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`${styles.addressCard} ${
                          selectedAddress === addr.id ? styles.selected : ""
                        }`}
                        onClick={() => setSelectedAddress(addr.id)}
                      >
                        <input
                          type="radio"
                          checked={selectedAddress === addr.id}
                          onChange={() => setSelectedAddress(addr.id)}
                        />
                        <div>
                          <strong>{addr.title}</strong>
                          <p>{addr.full_address}</p>
                          <p>
                            {addr.city}, {addr.region} {addr.zipcode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.address && (
                  <span className={styles.error}>{errors.address}</span>
                )}
              </div>
            )}

            {step === 2 && (
              <div className={styles.section}>
                <h2>Payment Information</h2>
                <div className={styles.paymentForm}>
                  <div className={styles.formGroup}>
                    <label>Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={handlePaymentChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                    {errors.cardNumber && (
                      <span className={styles.error}>{errors.cardNumber}</span>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      name="cardName"
                      value={paymentData.cardName}
                      onChange={handlePaymentChange}
                      placeholder="John Doe"
                    />
                    {errors.cardName && (
                      <span className={styles.error}>{errors.cardName}</span>
                    )}
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        name="expiry"
                        value={paymentData.expiry}
                        onChange={handlePaymentChange}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                      {errors.expiry && (
                        <span className={styles.error}>{errors.expiry}</span>
                      )}
                    </div>
                    <div className={styles.formGroup}>
                      <label>CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentData.cvv}
                        onChange={handlePaymentChange}
                        placeholder="123"
                        maxLength="4"
                      />
                      {errors.cvv && (
                        <span className={styles.error}>{errors.cvv}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={styles.section}>
                <h2>Review Your Order</h2>
                <div className={styles.reviewSection}>
                  <h3>Shipping Address</h3>
                  {selectedAddressData && (
                    <div className={styles.reviewAddress}>
                      <strong>{selectedAddressData.title}</strong>
                      <p>{selectedAddressData.full_address}</p>
                      <p>
                        {selectedAddressData.city}, {selectedAddressData.region}{" "}
                        {selectedAddressData.zipcode}
                      </p>
                    </div>
                  )}
                </div>
                <div className={styles.reviewSection}>
                  <h3>Payment Method</h3>
                  <p>
                    {getCardType(paymentData.cardNumber).toUpperCase()} ending in{" "}
                    {paymentData.cardNumber.slice(-4)}
                  </p>
                </div>
                <div className={styles.reviewSection}>
                  <h3>Order Items</h3>
                  {items.map((item, idx) => (
                    <div key={idx} className={styles.reviewItem}>
                      <img src={item.image} alt={item.name} />
                      <div>
                        <p>{item.name}</p>
                        <p>Size: {item.size} | Qty: {item.quantity}</p>
                      </div>
                      <span>${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                {errors.submit && (
                  <span className={styles.error}>{errors.submit}</span>
                )}
              </div>
            )}

            <div className={styles.navigation}>
              {step > 1 && (
                <Button onClick={() => setStep(step - 1)}>Back</Button>
              )}
              {step < 3 ? (
                <Button onClick={handleNextStep}>Continue</Button>
              ) : (
                <Button onClick={handlePlaceOrder} disabled={processing}>
                  {processing ? "Processing..." : "Place Order"}
                </Button>
              )}
            </div>
          </div>

          <div className={styles.summary}>
            <h3>Order Summary</h3>
            <div className={styles.summaryItems}>
              {items.map((item, idx) => (
                <div key={idx} className={styles.summaryItem}>
                  <span>
                    {item.name} (x{item.quantity})
                  </span>
                  <span>${item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <hr />
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <hr />
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

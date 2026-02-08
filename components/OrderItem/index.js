import React from "react";
import { format } from "date-fns";
import Link from "next/link";

import styles from "./order.module.scss";
import { useAddress } from "hooks/address.hook";

export default function OrderItem({ data }) {
  const address = useAddress(data.address);
  const { title, region, city, full_address, zipcode } = address.data;

  return (
    <Link href={`/account/orders/${data.id}`}>
      <div className={styles.container} style={{ cursor: "pointer" }}>
        <div className={styles.header}>
          <div>
            <h4>Order date</h4>
            <span>{format(data.date, "MM.dd.yyyy - HH:mm")}</span>
          </div>
          <div>
            <h4>Order Summary</h4>
            <span>{data.products.length} product</span>
          </div>
          <div>
            <h4>Status</h4>
            <span>{data.status}</span>
          </div>
          <div>
            <h4>Price</h4>
            <span>${data.total_price.toFixed(2)}</span>
          </div>
        </div>
        <hr />
        <div className={styles.productPhotos}>
          {data.products?.slice(0, 3).map((product, idx) => (
            <img
              key={idx}
              className={styles.photo}
              src={product.image || "https://via.placeholder.com/120"}
              alt={product.name}
              loading="lazy"
            />
          ))}
        </div>
        <hr />
        <div className={styles.addressContainer}>
          <details onClick={(e) => e.stopPropagation()}>
            <summary>Show Address</summary>
            {!address.loading && (
              <>
                <p>
                  <span className={styles.title}>Address Title: </span>
                  {title}
                </p>
                <p>{full_address}</p>
                <p>
                  {city} / {zipcode}
                </p>
                <p>{region}</p>
              </>
            )}
          </details>
        </div>
      </div>
    </Link>
  );
}

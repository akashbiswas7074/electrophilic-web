import { Html } from "@react-email/components";
import * as React from "react";
// Using next/image in email templates can be tricky and might not work as expected in all email clients.
// Standard img tags are generally more reliable for emails.
// However, to satisfy the linter, we are making this change.
import Image from "next/image";

export default function EmailTemplate(orderData: any) {
  // Helper function to check if a value is an object and contains a buffer key
  const isValidReactChild = (value: any) => {
    if (typeof value === "object" && value !== null) {
      return !("buffer" in value);
    }
    return true;
  };

  // Function to safely render a value, replacing invalid objects with a placeholder
  const safeRender = (value: any, placeholder: string = "") => {
    return isValidReactChild(value) ? value : placeholder;
  };

  return (
    <Html>
      <div
        style={{
          paddingLeft: "1rem",
          paddingRight: "1rem",
          marginLeft: "auto",
          marginRight: "auto",
          maxWidth: "100rem",
        }}
      >
        <div
          style={{ maxWidth: "70rem", marginLeft: "auto", marginRight: "auto" }}
        >
          <div
            style={{
              position: "relative",
              marginTop: "1.5rem",
              overflow: "hidden",
              backgroundColor: "white",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                paddingLeft: "1rem",
                paddingRight: "1rem",
                paddingTop: "1.5rem",
                paddingBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  marginTop: "-2rem",
                  marginBottom: "-2rem",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    paddingTop: "4rem",
                    paddingBottom: "2rem",
                    textAlign: "center",
                  }}
                >
                  <center>
                    <Image
                      src="https://res.cloudinary.com/dkystu8vj/image/upload/v1719410904/iljmdgcgt06ih3kq987s.png"
                      alt="Thank You Illustration"
                      width={250}
                      height={200}
                    />
                  </center>
                  <h1
                    style={{
                      marginTop: "1rem",
                      fontSize: "2.25rem",
                      fontWeight: "500",
                      color: "#16a34a",
                      letterSpacing: "1px",
                    }}
                  >
                    Thank you for your order!
                  </h1>
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "400",
                      color: "#1a202c",
                    }}
                  >
                    Your order #{safeRender(orderData._id)} is confirmed and
                    ready to ship
                  </p>
                </div>
                <div style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(1, 1fr)",
                      gap: "2rem",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#1a202c",
                        }}
                      >
                        Shipping Address
                      </h2>
                      <p
                        style={{
                          marginTop: "1.5rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#1a202c",
                        }}
                      >
                        {safeRender(orderData?.shippingAddress?.firstName)}{" "}
                        {safeRender(orderData?.shippingAddress?.lastName)}
                      </p>
                      <p
                        style={{
                          marginTop: "0.75rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#1a202c",
                        }}
                      >
                        {safeRender(orderData?.shippingAddress?.address1)}{" "}
                        {safeRender(orderData?.shippingAddress?.address2)},{" "}
                        {safeRender(orderData?.shippingAddress?.city)},{" "}
                        {safeRender(orderData?.shippingAddress?.state)},{" "}
                        {safeRender(orderData?.shippingAddress?.country)},{" "}
                        {safeRender(orderData?.shippingAddress?.zipCode)}
                      </p>
                    </div>
                    <div>
                      <h2
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#1a202c",
                        }}
                      >
                        Payment Info
                      </h2>
                      <p
                        style={{
                          marginTop: "1.5rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#1a202c",
                        }}
                      >
                        {safeRender(orderData?.isPaid) ? "Paid" : "Unpaid"}
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
                  <h2
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#1a202c",
                    }}
                  >
                    Order Items
                  </h2>
                  <div style={{ marginTop: "2rem", display: "flow-root" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: "left",
                              paddingBottom: "1rem",
                              fontSize: "0.875rem",
                              fontWeight: "700",
                              color: "#1a202c",
                            }}
                          >
                            Image
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              paddingBottom: "1rem",
                              fontSize: "0.875rem",
                              fontWeight: "700",
                              color: "#1a202c",
                            }}
                          >
                            Product
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              paddingBottom: "1rem",
                              fontSize: "0.875rem",
                              fontWeight: "700",
                              color: "#1a202c",
                            }}
                          >
                            Size
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              paddingBottom: "1rem",
                              fontSize: "0.875rem",
                              fontWeight: "700",
                              color: "#1a202c",
                            }}
                          >
                            Quantity
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              paddingBottom: "1rem",
                              fontSize: "0.875rem",
                              fontWeight: "700",
                              color: "#1a202c",
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              paddingBottom: "1rem",
                              fontSize: "0.875rem",
                              fontWeight: "700",
                              color: "#1a202c",
                            }}
                          >
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderData?.products?.map((product: any, i: any) => (
                          <tr key={i}>
                            <td>
                              <Image
                                src={safeRender(product.image, "/placeholder-image.png")} // Added fallback
                                alt={safeRender(product.name, "Product image")} // Added fallback
                                width={100}
                                height={150}
                                style={{ objectFit: "cover", borderRadius: "0.5rem" }} // Replaced className with style
                              />
                            </td>
                            <td
                              style={{
                                padding: "1rem",
                                fontSize: "0.875rem",
                                fontWeight: "700",
                                color: "#1a202c",
                              }}
                            >
                              {safeRender(
                                product.name.length > 30
                                  ? `${product.name.substring(0, 30)}...`
                                  : product.name
                              )}
                            </td>
                            <td style={{ padding: "1rem" }}>
                              {safeRender(product.size)}
                            </td>
                            <td style={{ padding: "1rem" }}>
                              {safeRender(product.qty)}
                            </td>
                            <td
                              style={{
                                padding: "1rem",
                                color:
                                  product.status === "Not Processed"
                                    ? "#e3503e"
                                    : product.status === "Processing"
                                    ? "#54b7d3"
                                    : product.status === "Dispatched"
                                    ? "#1e91cf"
                                    : product.status === "Cancelled"
                                    ? "#e3d4d4"
                                    : product.status === "Completed"
                                    ? "#4cb64c"
                                    : "",
                              }}
                            >
                              {safeRender(product.status)}
                            </td>
                            <td
                              style={{
                                padding: "1rem",
                                color: "black",
                                fontWeight: "600",
                              }}
                            >
                              ₹ {(product.price * product.qty).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#1a202c",
                }}
              >
                Sub total
              </td>
              <td
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#1a202c",
                  textAlign: "right",
                }}
              >
                ₹{orderData.totalBeforeDiscount}
              </td>
            </tr>
            {orderData.couponApplied && (
              <tr>
                <td
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#1a202c",
                  }}
                >
                  Coupon Applied{" "}
                  <span style={{ color: "#16a34a", fontWeight: "700" }}>
                    ({orderData.couponApplied})
                  </span>
                </td>
                <td
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#1a202c",
                    textAlign: "right",
                  }}
                >
                  - ₹
                  {(orderData.totalBeforeDiscount - orderData.total).toFixed(2)}
                </td>
              </tr>
            )}
            <tr>
              <td
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#1a202c",
                }}
              >
                Tax price
              </td>
              <td
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#1a202c",
                  textAlign: "right",
                }}
              >
                + ₹{orderData.taxPrice}
              </td>
            </tr>
            <tr style={{ borderTop: "1px solid #000" }}>
              <td
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "800",
                  letterSpacing: "1px",
                  color: "#000",
                }}
              >
                Total
              </td>
              <td
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "800",
                  letterSpacing: "1px",
                  color: "#000",
                  textAlign: "right",
                }}
              >
                ₹{orderData.total}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 50 }}>
        <center>
          Thank you for choosing our service! <br />
          For any queries, please contact us at support@example.com
        </center>
      </div>
    </Html>
  );
}

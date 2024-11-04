<template>
  <div id="container">
    <div id="Purchase-history-container">
      <menuComponent></menuComponent>
      <div id="Purchase-history-right">
        <h1>ตะกร้าสินค้า</h1>
        <div id="item-container">
          <div v-for="(product, index) in cartItems" :key="index" class="item">
            <div class="items">
              <input type="checkbox" v-model="product.checkbox" class="checked" @change="setSelectItem(product)" />
              <img :src="product.image" alt="" style="width: 100px; height: 100px" />

              <div class="item-1">
                <p>
                  <span> {{ truncatedName(product.nameProduct) }}</span>
                </p>
                <p>
                  ตัวเลือก:<span>{{ product.productTypes }}</span>
                </p>
              </div>
              <div class="item-2">
                <div class="quantitycount">
                  <input type="number" v-model="product.quantity" min="1" @change="
                    onQuantityChange(product.id, product.quantity)
                    " :disabled="!product.checkbox" />
                </div>
                <div class="product-line-price">
                  {{ calculateLinePrice(product).toFixed(2) }} บาท
                </div>
              </div>
            </div>
          </div>
          <div class="item-button">
            <button @click="handleClick">สั่งซื้อ</button>
            <button @click="selectAllbutton(cartItems)">
              เลือกสินค้าทั้งหมด
            </button>
            <button @click="clearCart()">ลบรายการสินค้า</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <footerComponent></footerComponent>
</template>

<script>
import axios from "axios";
import { jwtDecode } from "jwt-decode";
export default {
  data() {
    return {
      selectedItems: [],
      cartItems: [],
      currentPage: 1,
      itemsPerPage: 12,
      totalItems: 0,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.totalItems / this.itemsPerPage);
    },
    paginatedProducts() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.cartItems.slice(start, end);
    },
    totalPrice() {
      if (this.selectedItems.length > 0) {
        return this.calculateLinePrice(this.selectedItems[0]).toFixed(2);
      }
      return 0;
    },
  },
  methods: {
    truncatedName(name) {
      if (name.length > 35) {
        // const firstLine = name.substring(0, 20);
        const secondLine = name.substring(0, 35) + "...";
        return `${secondLine}`;
      }
      return name;
    },
    setSelectItem(product) {
      if (product.checkbox) {
        // ถ้าถูกเลือก เพิ่มสินค้าเข้าไปใน selectedItems
        this.selectedItems.push(product);
      } else {
        // ถ้าถูกยกเลิกการเลือก เอาสินค้าออกจาก selectedItems
        const index = this.selectedItems.findIndex(
          (item) => item.id === product.id
        );
        if (index !== -1) {
          this.selectedItems.splice(index, 1);
        }
      }
      console.log("Selected items:", this.selectedItems);
    },
    async loadCart() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
          throw new Error("User not found in localStorage");
        }
        const userEmail = user.email;
        if (!userEmail) {
          throw new Error("User email not found");
        }

        const response = await axios.get("http://localhost:8081/products/getCart");
        const allCartItems = response.data;
        console.log("allCartItems", allCartItems);

        this.cartItems = allCartItems.filter((entry) => entry.email === userEmail);

        const tempCart = [];

        this.cartItems.forEach((item) => {
          const existingItem = tempCart.find(
            (tempItem) => tempItem.productId === item.productId && tempItem.productTypes === item.productTypes
          );

          if (existingItem) {
            existingItem.quantity += item.quantity;
          } else {
            tempCart.push({ ...item });
          }
        });

        this.cartItems = tempCart;

        this.cartItems.forEach((item) => {
          if (item.quantity === 0) {
            item.quantity = 1;
          }
        });

        this.totalItems = this.cartItems.length;
        console.log("this.cartItems", this.cartItems);
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    },
    calculateLinePrice(product) {
      return product.price * product.quantity;
    },
    userEmail() {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("User Email:", user ? user.email : null);
      return user ? user.email : null;
    },
    addToHistoryClicked() {
      if (this.selectedItems.length > 0) {
        this.selectedItems.forEach((product) => {
          // const calculatedPrice = this.calculateLinePrice(product).toFixed(2);

          const productData = {
            productId: product.id,
            nameProduct: product.nameProduct,
            price: product.price,
            quantity: product.quantity,
            image: product.image,
            email: product.email,
            shopId: product.shopId,
            productTypes: product.productTypes,
          };

          console.log("Product Data for History:", productData);

          axios
            .post(
              "http://localhost:8081/products/createHistoryEntry",
              productData
            )
            .then((response) => {
              console.log("Product added to history:", response.data);
            })
            .catch((error) => {
              console.error(
                "Error details:",
                error.response ? error.response.data : error
              );
            });
        });
      }
    },
    handleClick() {
      this.addToHistoryClicked();
      this.payment();
    },
    payment() {
      const selectedIds = this.selectedItems.map((product) => product.id);
      const totalAmount = this.selectedItems
        .reduce((sum, product) => sum + this.calculateLinePrice(product), 0)
        .toFixed(2);

      console.log("Selected IDs for payment:", selectedIds);
      console.log("Total amount:", totalAmount);

      axios
        .post("http://localhost:8081/2c2p/paymentToken", {
          // ProductID: selectedIds.join(', '),
          amount: totalAmount,
        })
        .then((paymentResponse) => {
          const payloadObject = paymentResponse.data;
          const payload = payloadObject.payload.payload.toString();
          console.log("Payload received from 2C2P:", payload);

          if (typeof payload === "string") {
            const decoded = jwtDecode(payload);
            console.log("Decoded JWT:", decoded);
            const webPaymentUrl = decoded.webPaymentUrl;

            if (webPaymentUrl) {
              window.location.href = webPaymentUrl;
            } else {
              alert("ไม่พบลิงก์สำหรับการจ่ายเงินใน Payload");
            }
          } else {
            console.error("Invalid token: Payload is not a string", payload);
            alert("เกิดข้อผิดพลาดในการประมวลผล payment token");
          }
        })
        .catch((error) => {
          if (error.response) {
            console.error(
              "Error processing payment token:",
              error.response.data
            );
          } else {
            console.error("Error processing payment token:", error.message);
          }
          alert("เกิดข้อผิดพลาดในการประมวลผล payment token");
        });
    },
    onQuantityChange(id, newQuantity) {
      console.log("id",id);
      
    const product = this.cartItems.find((item) => item.id === id); 
    if (product) {
        product.quantity = newQuantity;

        axios
            .put(`http://localhost:8081/products/updateCartQuantity/${id}`, { 
                quantityCheng: newQuantity,
            })
            .then((response) => {
                console.log("Quantity updated:", response.data);
            })
            .catch((error) => {
                console.error("Error updating quantity:", error);
            });
    } else {
        console.error("Product not found");
    }
}
,
    // async removeFromCart(productId) {
    //   try {
    //     await axios.delete(
    //       `http://localhost:8081/products/delCart/${productId}`
    //     );
    //     this.cartItems = this.cartItems.filter((item) => item.id !== productId);
    //     this.totalItems = this.cartItems.length;
    //   } catch (error) {
    //     console.error("Error removing product from cart:", error);
    //   }
    // },
    async clearCart() {
    // กรองรายการที่เลือกจาก checkbox
    const itemsToRemove = this.selectedItems.filter(
        (product) => product.checkbox
    );

    try {
        for (const product of itemsToRemove) {
            await axios.delete(
                `http://localhost:8081/products/delCart/${product.id}`
            );
            console.log(`Deleted product with ID: ${product.id}`);
        }
        await this.loadCart();
    } catch (error) {
        console.error("Error canceling orders:", error);
    }
},
selectAllbutton(allItems) {
  const allSelected = allItems.every(product => product.checkbox);
  
  allItems.forEach(product => {
    product.checkbox = !allSelected;
    
    if (product.checkbox) {
      if (!this.selectedItems.includes(product)) {
        this.selectedItems.push(product);
      }
    } else {
      const index = this.selectedItems.findIndex(item => item.id === product.id);
      if (index !== -1) {
        this.selectedItems.splice(index, 1);
      }
    }
  });

  console.log("Selected items after toggle:", this.selectedItems);
}
,
    async checkout() {
      const totalAmount = this.cartTotal;
      const success = await this.processPayment({
        userId: 1,
        amount: totalAmount,
      }); 
      if (success) {
        alert("ชำระเงินสำเร็จ");
        console.log("ยอดเงินคงเหลือ: " + this.currentBalance);
        this.$store.commit("REMOVE_ALL_CART_ITEMS");
      } else {
        alert("ยอดเงินไม่พอ");
      }
    },
    gotoPage(page) {
      this.currentPage = page;
    },
  },
  async mounted() {
    await this.loadCart();
  },
};
</script>

<style scoped>
* {
  font-family: "Noto Sans Thai", sans-serif;
  font-weight: 500;
  font-style: normal;
}

#container {
  /* margin-top: 55px; */
  height: auto;
  /* min-height: 690px; */
  display: flex;
  width: 100%;
  /* justify-content: center; */
  flex-direction: column;
  align-items: center;
  margin-top: 2rem;
}

/* #Purchase-history-container {
  width: 1000px;
  height: auto;
  min-height: 590px;
  background-color: #1f1b3a;
  display: flex;
  align-items: stretch;
  margin-top: 4rem;
} */

#Purchase-history-container {
  width: 1100px;
  height: 100%;
  /* กำหนดขนาดเท่ากัน */
  background-color: #1f1b3a;
  display: flex;
  align-items: stretch;
  margin-top: 2rem;
  /* ระยะห่างด้านบนเท่ากัน */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

#Purchase-history-right {
  width: 1100px;
  height: auto;
  min-height: 590px;
  padding: 20px;
  background-color: #e6e6e6;
  display: flex;
  /* margin-top: -15px;
    margin-right: -38px; */
  flex-direction: column;
  gap: 1.5rem;
}

h1 {
  /* font-size: 24px; */
  margin-top: 20px;
  font-weight: 700;
}

#item-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.item {
  background-color: #ffffff;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.items {
  display: flex;
  align-items: center;
  gap: 30px;
  width: 100%;
}

.item-2 {
  width: 90px;
  padding: 0 20px;
  gap: 25px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: auto;
}

.checked {
  width: 30px;
  height: 30px;
  cursor: pointer;
  transition: 0.3s;
}

.product-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
}

.item-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.product-name,
.product-type {
  margin: 0;
  font-size: 14px;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.quantitycount input {
  font-size: 18px;
  width: 50px;
  text-align: center;
}

.product-line-price {
  font-size: 16px;
  font-weight: bold;
}

.item-button {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.item-button button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.item-button button:first-child {
  background-color: #fde0ae;
  border-color: #fcdca6;
  cursor: pointer;
  transition: 0.3s;
}

.item-button button:first-child:hover {
  background-color: #ffc869;
}

.item-button button:nth-child(2),
.item-button button:nth-child(3) {
  background-color: #ffffff;
  cursor: pointer;
  transition: 0.3s;
}

.item-button button:nth-child(2):hover {
  color: #236500;
  border-color: #72bf78;
}

.item-button button:nth-child(3):hover {
  color: #ff3636;
  border-color: #ff3636;
}

#container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  overflow: hidden;
  margin-top: 2rem;
  /* ระยะห่างด้านบน */
}

</style>

const express = require("express");
const router = express.Router();
const { Product, history, cart, comment } = require("../configs/database");

router.post("/createGraph", async (req, res) => {
    const {
        id,
        name,
        price,
        stock,
        totalSales,
        numberOfOrders,
        itemsSold,
        cogs,
        shippingCosts,
        day,
        month,
        year,
    } = req.body;
    try {
        const newProduct = await Product.create({
            id,
            name,
            price,
            stock,
            totalSales,
            numberOfOrders,
            itemsSold,
            cogs,
            shippingCosts,
            day,
            month,
            year,
        });
        console.log("Product created successfully");
        res.status(201).json(newProduct);
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).send("Error creating product");
    }
});
router.get("/getGraph", async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).send("Error fetching products");
    }
});
router.delete("/delGraph", async (req, res) => {
    try {
        await Product.destroy({ where: {} });
        res.status(200).send("All products have been deleted.");
    } catch (error) {
        console.error("Error deleting products:", error);
        res.status(500).send("Error deleting products");
    }
});
router.post("/createHistoryEntry", async (req, res) => {
    const {
        productId,
        image,
        email,
        nameProduct,
        shopId,
        price,
        quantity,
        productTypes,
    } = req.body;
    try {
        console.log("Request Body:", req.body);
        if (
            !productId ||
            !nameProduct ||
            !shopId ||
            price === undefined ||
            quantity === undefined
        ) {
            throw new Error("Missing required fields");
        }
        const newHistoryEntry = await history.create({
            productId,
            image,
            email,
            nameProduct,
            shopId,
            price: parseFloat(price),
            quantity: parseInt(quantity, 10),
            productTypes,
        });

        console.log("Entry created successfully in history");
        res.status(201).json(newHistoryEntry);
    } catch (error) {
        console.error("Error creating history entry:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Error creating history entry" });
    }
});
router.delete("/Comment", async (req, res) => {
    try {
        await comment.destroy({ where: {} });
        res.status(200).send("cart entry has been deleted.");
    } catch (error) {
        console.error("Error deleting cart entry:", error);
        res.status(500).send("Error deleting cart entry");
    }
});
router.post("/createComment", async (req, res) => {
    const {
        AcImg,
        AcName,
        nameProduct,
        imageProduct,
        price,
        detail,
        imageComment,
        star,
        email,
        historyId,
        productId,
    } = req.body;
    try {
        const newHistoryEntry = await comment.create({
            nameProduct,
            imageProduct,
            price,
            detail,
            imageComment,
            star,
            email,
            historyId,
            productId,
            AcImg,
            AcName,
        });

        console.log("Entry created successfully in history");
        res.status(201).json(newHistoryEntry);
    } catch (error) {
        console.error("Error creating history entry:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Error creating history entry" });
    }
});
router.get("/getComments/:productId", async (req, res) => {
    const { productId } = req.params;
    try {
        const comments = await comment.findAll({ where: { productId } });

        if (comments.length === 0) {
            return res.status(404).json({ message: "No comments found." });
        }
        console.log("Comments retrieved successfully.");
        res.status(200).json(comments);
    } catch (error) {
        console.error("Error retrieving comments:", error.message);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Error retrieving comments" });
    }
});
router.get("/getComments", async (req, res) => {
    try {
        const comments = await comment.findAll({ where: {} });

        console.log("Comments retrieved successfully.");
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: "Error retrieving comments" });
    }
});
router.post("/createCartEntry", async (req, res) => { 
    const {
        productId,
        image,
        email,
        nameProduct,
        shopId,
        price,
        quantity,
        productTypes,
    } = req.body;

    try {
        console.log("Request Body:", req.body);
    
        if (
            !productId ||
            !nameProduct ||
            !shopId ||
            price === undefined ||
            quantity === undefined ||
            !productTypes 
        ) {
            return res.status(400).send("Missing required fields"); // ส่งสถานะ 400 หากข้อมูลไม่ครบ
        }

        // ตรวจสอบสินค้าว่ามีในตะกร้าหรือไม่
        const existingCartItem = await cart.findOne({
            where: {
                productId: productId,
                productTypes: productTypes,
                email: email 
            }
        });

        if (existingCartItem) {
            // หากพบรายการสินค้าในตะกร้า
            const updatedQuantity = existingCartItem.quantity + parseInt(quantity, 10); // เพิ่มจำนวน
            await existingCartItem.update({ quantity: updatedQuantity }); // อัปเดตจำนวน
            console.log("Updated existing cart item successfully");
            return res.status(200).json({ message: 'Quantity updated successfully', existingCartItem });
        } else {
            // หากไม่มีรายการสินค้าในตะกร้า ให้สร้างรายการใหม่
            const newCartEntry = await cart.create({
                productId,
                image,
                email,
                nameProduct,
                shopId,
                price: parseFloat(price),
                quantity: parseInt(quantity, 10),
                productTypes,
            });

            console.log("Entry created successfully in cart");
            return res.status(201).json(newCartEntry);
        }
    } catch (error) {
        console.error("Error creating cart entry:", error.message);
        console.error("Error stack:", error.stack);
        return res.status(500).send("Error creating cart entry"); // ส่งสถานะ 500 หากเกิดข้อผิดพลาด
    }
});


router.get("/getHistory", async (req, res) => {
    try {
        const historyEntries = await history.findAll();
        res.json(historyEntries);
    } catch (error) {
        console.error("Error fetching history entries:", error);
        res.status(500).send("Error fetching history entries");
    }
});
router.get("/getCart", async (req, res) => {
    try {
        const cartEntries = await cart.findAll();
        res.json(cartEntries);
    } catch (error) {
        console.error("Error fetching cart entries:", error);
        res.status(500).send("Error fetching cart entries");
    }
});
router.delete("/delHistory/:Historyid", async (req, res) => {
    const { Historyid } = req.params;

    try {
        // Delete the product with the provided productId from the history table
        const result = await history.destroy({ where: { Historyid } });

        if (result > 0) {
            res.status(200).send(`Product with ID ${Historyid} has been deleted.`);
        } else {
            res.status(404).send(`Product with ID ${Historyid} not found.`);
        }
    } catch (error) {
        console.error("Error deleting history entry:", error);
        res.status(500).send("Error deleting history entry.");
    }
});
router.patch("/cart/:id", async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    try {
        const [updated] = await cart.update({ quantity }, { where: { id } });
    } catch (error) {
        console.error("Error deleting history entry:", error);
        res.status(500).send("Error deleting history entry.");
    }
});
router.delete("/delCart/:id", async (req, res) => { // เปลี่ยนเป็น :id
    const { id } = req.params; // เปลี่ยนจาก productId เป็น id
    try {
        // ใช้ id แทน productId ในการลบรายการ
        const deletedCount = await cart.destroy({ where: { id } }); // เปลี่ยนเป็น id
        if (deletedCount === 0) {
            return res.status(404).send("No cart entries found for this ID.");
        }
        res.status(200).send("Cart entry has been deleted.");
    } catch (error) {
        console.error("Error deleting cart entries:", error);
        res.status(500).send("Error deleting cart entries");
    }
});

router.delete("/delHistory", async (req, res) => {
    try {
        await history.destroy({ where: {} });

        res.status(200).send("History entry has been deleted.");
    } catch (error) {
        console.error("Error deleting history entry:", error);
        res.status(500).send("Error deleting history entry");
    }
});
router.delete("/delCart", async (req, res) => {
    try {
        await cart.destroy({ where: {} });
        res.status(200).send("cart entry has been deleted.");
    } catch (error) {
        console.error("Error deleting cart entry:", error);
        res.status(500).send("Error deleting cart entry");
    }
});
router.put("/updateCartQuantity/:id", async (req, res) => { 
    const { id } = req.params;
    const { additionalQuantity, quantityCheng } = req.body;

    try {
        const existingProduct = await cart.findOne({ where: { id } }); 

        if (existingProduct) {
            if (additionalQuantity !== undefined) {
                const updatedQuantity =
                    existingProduct.quantity + parseInt(additionalQuantity, 10);
                await existingProduct.update({ quantity: updatedQuantity });
                res.status(200).json({
                    message: "Product quantity updated successfully",
                    updatedQuantity,
                });
            } else if (quantityCheng !== undefined) {
                await existingProduct.update({ quantity: parseInt(quantityCheng, 10) });
                res.status(200).json({
                    message: "Product quantity set successfully",
                    quantity: quantityCheng,
                });
            } else {
                res.status(400).json({ error: "No quantity update provided" });
            }
        } else {
            res.status(404).json({ error: "Product not found in cart" });
        }
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        res.status(500).json({ error: "Error updating cart quantity" });
    }
});


router.get("/checkCart/:productId", async (req, res) => {
    const { productId } = req.params;

    try {
        const existingProduct = await cart.findOne({ where: { productId } });
        if (existingProduct) {
            res.status(200).json({ exists: true });
        } else {
            res.status(200).json({ exists: false });
        }
    } catch (error) {
        console.error("Error checking cart:", error);
        res.status(500).json({ error: "Error checking cart" });
    }
router.get("/checkCart", async (req, res) => {
    const { productId, productTypes, email } = req.query; 

    try {
        if (!productId || !productTypes || !email) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const cartItem = await cart.findOne({
            where: {
                productId: productId,
                productTypes: productTypes,
                email: email
            }
        });

        return res.status(200).json({ exists: !!cartItem });
    } catch (error) {
        console.error("Error checking cart:", error.message);
        return res.status(500).send("Error checking cart");
    }
});

});
module.exports = router;

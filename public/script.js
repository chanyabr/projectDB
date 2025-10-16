let menuItems = [
    {id: 1, name: "Burger", price: 5},
    {id: 2, name: "Pizza", price: 8},
    {id: 3, name: "Sushi", price: 12},
    {id: 4, name: "Salad", price: 6},
];

let currentUser = null;

// โหลดหน้า Login ตอนเปิดเว็บ
window.onload = function(){
    showLogin();
    updateProfileBtn();
}

// ================= HELPER =================

function updateProfileBtn() {
    const btn = document.getElementById('profileBtn');
    if(btn){
        btn.style.display = currentUser ? "inline" : "none";
    }
}

// ================= LOGIN / SIGNUP =================

function showLogin() {
    document.getElementById('main').innerHTML = `
        <form onsubmit="login(event)">
            <h2>Login</h2>
            <input type="text" id="loginUsername" placeholder="Username" required>
            <input type="password" id="loginPassword" placeholder="Password" required>
            <button type="submit">Login</button>
            <p>Don't have an account? <a href="#" onclick="showSignup()">Sign up</a></p>
        </form>
    `;
}

function showSignup() {
    document.getElementById('main').innerHTML = `
        <form onsubmit="signup(event)">
            <h2>Sign Up</h2>
            <input type="text" id="signupUsername" placeholder="Username" required>
            <input type="password" id="signupPassword" placeholder="Password" required>
            <button type="submit">Sign Up</button>
            <p>Already have an account? <a href="#" onclick="showLogin()">Login</a></p>
        </form>
    `;
}

// Signup → POST /signup
async function signup(event) {
    event.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const res = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if(res.ok){
            alert("Signup successful! Please login.");
            showLogin();
        } else {
            const text = await res.text();
            alert("Signup failed: " + text);
        }
    } catch(err) {
        console.error(err);
        alert("Server error");
    }
}

// Login → POST /login
async function login(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if(res.ok){
            const data = await res.json();
            currentUser = data; // { userId, username }
            alert("Login successful!");
            updateProfileBtn();
            showMenu();
        } else {
            const text = await res.text();
            alert("Login failed: " + text);
        }
    } catch(err) {
        console.error(err);
        alert("Server error");
    }
}

// ================= PROFILE =================

function showProfile() {
    if(!currentUser){
        showLogin();
        return;
    }

    document.getElementById('main').innerHTML = `
        <h2>Welcome, ${currentUser.username}</h2>
        <button onclick="showMenu()">Menu</button>
        <button onclick="logout()">Logout</button>
        <button onclick="deleteAccount()">Delete Account</button>
        <button onclick="showOrderHistory()">Order History</button>
    `;
}

function logout() {
    currentUser = null;
    alert("You have been logged out.");
    updateProfileBtn();
    showLogin();
}

async function deleteAccount() {
    if(!currentUser) return;

    const confirmDelete = confirm("Are you sure?");
    if(!confirmDelete) return;

    try {
        const res = await fetch(`http://localhost:3000/users/${currentUser.userId}`, {
            method: 'DELETE'
        });

        if(res.ok){
            alert("Account deleted!");
            currentUser = null;
            cart = [];
            showLogin();
        } else {
            const text = await res.text();
            alert("Failed: " + text);
        }
    } catch(err){
        console.error(err);
        alert("Server error");
    }
}

// ================= MENU =================

function showMenu() {
    if(!currentUser){
        alert("Please login first!");
        showLogin();
        return;
    }

    let html = '<div class="menu"><h2>Menu</h2>';
    menuItems.forEach(item => {
        html += `
        <div class="food-item">
            <h3>${item.name}</h3>
            <p>Price: $${item.price}</p>
            <button onclick="addToCart(${item.id})">Add to Cart</button>
        </div>`;
    });
    html += `<button onclick="showCart()">Go to Cart</button></div>`;
    document.getElementById('main').innerHTML = html;
}

// Add item to cart → POST /cart
async function addToCart(id) {
    if(!currentUser){
        alert("Please login first!");
        showLogin();
        return;
    }

    const item = menuItems.find(f => f.id === id);

    try {
        const res = await fetch('http://localhost:3000/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.userId,
                food_name: item.name,
                price: item.price
            })
        });

        if(res.ok){
            alert(item.name + " added to cart!");
        } else {
            const text = await res.text();
            alert("Failed: " + text);
        }
    } catch(err){
        console.error(err);
        alert("Server error");
    }
}

// ================= CART =================

// Show cart → GET /cart/:userId
async function showCart() {
    if(!currentUser){
        alert("Please login first!");
        showLogin();
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/cart/${currentUser.userId}`);
        const cartItems = await res.json();

        if(cartItems.length === 0){
            document.getElementById('main').innerHTML = "<h2>Your cart is empty.</h2>";
            return;
        }

        let total = 0;
        let html = '<div class="cart"><h2>Your Cart</h2>';
        cartItems.forEach(item => {
            total += parseFloat(item.price);
            html += `<p>${item.food_name} - $${item.price} 
                     <button onclick="removeFromCart(${item.id})">Remove</button></p>`;
        });
        html += `<p><strong>Total: $${total.toFixed(2)}</strong></p>`;
        html += `<button onclick="checkout()">Checkout</button>`;
        html += `<button onclick="showMenu()">Back to Menu</button></div>`;
        document.getElementById('main').innerHTML = html;
    } catch(err){
        console.error(err);
        alert("Server error");
    }
}

// Remove item from cart → DELETE /cart/:id
async function removeFromCart(id) {
    try {
        const res = await fetch(`http://localhost:3000/cart/${id}`, { method: 'DELETE' });
        if(res.ok){
            showCart();
        } else {
            const text = await res.text();
            alert("Failed: " + text);
        }
    } catch(err){
        console.error(err);
        alert("Server error");
    }
}

// ================= CHECKOUT =================

async function checkout() {
    if(!currentUser) return;

    const confirmCheckout = confirm("Proceed to checkout?");
    if(!confirmCheckout) return;

    try {
        const res = await fetch(`http://localhost:3000/cart/checkout/${currentUser.userId}`, { method: 'POST' });
        if(res.ok){
            alert("Purchase successful!");
            showMenu();
        } else {
            const text = await res.text();
            alert("Checkout failed: " + text);
        }
    } catch(err){
        console.error(err);
        alert("Server error");
    }
}

// ================= ORDER HISTORY =================

async function showOrderHistory() {
    if(!currentUser) return;

    try {
        const res = await fetch(`http://localhost:3000/orders/${currentUser.userId}`);
        const orders = await res.json();

        if(orders.length === 0){
            document.getElementById('main').innerHTML = "<h2>No orders yet.</h2>";
            return;
        }

        let html = '<div class="orders"><h2>Order History</h2>';
        orders.forEach(order => {
            html += `<p>Order #${order.id} - ${order.order_date}</p>`;
            order.items.forEach(item => {
                html += `<p>&nbsp;&nbsp;${item.food_name} - $${item.price}</p>`;
            });
        });
        html += `<button onclick="showProfile()">Back to Profile</button></div>`;
        document.getElementById('main').innerHTML = html;

    } catch(err){
        console.error(err);
        alert("Server error");
    }
}


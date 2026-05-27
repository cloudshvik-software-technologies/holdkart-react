# HoldKart Customer — React Frontend

  ## Quick Start

  ### 1. Install dependencies
  ```bash
  npm install
  ```

  ### 2. Configure environment
  Edit `.env`:
  ```
  VITE_API_BASE_URL=http://localhost:8081      # Customer backend
  VITE_SELLER_API_URL=http://localhost:8080    # Seller backend (product images)
  VITE_RAZORPAY_KEY_ID=your_razorpay_key_id   # Optional, for online payments
  ```

  ### 3. Start dev server
  ```bash
  npm run dev
  ```
  Opens at **http://localhost:5173**

  ---

  ## Routes & Auth

  | Route | Auth Required |
  |-------|--------------|
  | /login | Guest only |
  | /register | Guest only |
  | /forgot | Guest only |
  | /reset-password | Guest only |
  | / (Home) | ✅ Login required |
  | /products | ✅ Login required |
  | /product/:id | ✅ Login required |
  | /campaigns | ✅ Login required |
  | /cart | ✅ Login required |
  | /checkout | ✅ Login required |
  | /orders | ✅ Login required |
  | /wishlist | ✅ Login required |
  | /profile | ✅ Login required |
  | /notifications | ✅ Login required |
  | /complaints | ✅ Login required |

  Unauthenticated users visiting any protected page are automatically redirected to /login.

  ## Navigation
  - The **HoldKart logo** in the header serves as the home button
  - No separate "Home" link in the navigation
  
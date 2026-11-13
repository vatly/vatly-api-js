export interface paths {
    "/checkouts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all checkouts
         * @description Returns a paginated list of checkouts for the authenticated merchant.
         *     Results are filtered by the testmode determined from the API token.
         */
        get: operations["listCheckouts"];
        put?: never;
        /**
         * Create a checkout
         * @description Creates a new hosted checkout session.
         *
         *     The checkout URL in the response can be used to redirect customers to complete their purchase.
         *     Checkouts expire after a configurable period (default: 24 hours).
         *
         *     **Products:**
         *     - Include one or more products using their `one_off_product_` or `subscription_plan_` IDs
         *     - Mix one-off products and subscription plans in the same checkout
         *     - Override prices for specific products using the `price` field
         *     - Add trial periods to subscription plans using `trialDays`
         *
         *     **Customer association:**
         *     - Optionally link to an existing customer using `customerId`
         *     - If not provided, a new customer is created based on checkout form input
         */
        post: operations["createCheckout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/checkouts/{checkoutId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a checkout
         * @description Retrieves a specific checkout by its ID.
         *     Use this to check the status of a checkout or get the order ID after completion.
         */
        get: operations["getCheckout"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all customers
         * @description Returns a paginated list of customers for the authenticated merchant.
         *     Results are filtered by the testmode determined from the API token.
         *
         *     Pass `email` to filter the list down to the customers holding an address —
         *     the way back to a customer id you no longer have.
         */
        get: operations["listCustomers"];
        put?: never;
        /**
         * Create a customer
         * @description Creates a customer, or returns the one that already holds the address.
         *
         *     Customers are uniquely identified by email within a storefront and
         *     testmode, and this endpoint is get-or-create on that key: posting an
         *     address that already exists returns the existing customer rather than a
         *     validation error, so an integration that lost its Vatly customer id can
         *     always get back to it. The status code says which happened:
         *
         *     | Status | Meaning |
         *     | --- | --- |
         *     | `201` | The customer was created by this request. |
         *     | `200` | A customer with this email already existed and is returned unchanged. |
         *
         *     A `200` response never modifies the customer — `name` and `metadata` in
         *     the request body are ignored for an existing customer. Use
         *     `PATCH /v1/customers/{customerId}` to change one.
         *
         *     A `201` can also complete a create that was interrupted before it
         *     finished, in which case the customer keeps the `id` and `createdAt` of
         *     that earlier attempt — so `createdAt` may predate the request. Treat it as
         *     when the customer came into being, not as when this call happened.
         *
         *     Addresses are canonicalized before they are compared, so `User@MÜLLER.de`
         *     and `user@xn--mller-kva.de` are the same customer. Beyond that the
         *     comparison is exact — `büyer@example.com` is a different mailbox and gets
         *     its own customer.
         *
         *     **Use cases:**
         *     - Pre-create customers before checkout
         *     - Link existing users from your system to Vatly
         *     - Recover the customer id for a known email after a re-sync or reset
         */
        post: operations["createCustomer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{customerId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a customer
         * @description Retrieves a specific customer by their ID.
         */
        get: operations["getCustomer"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update a customer
         * @description Updates a customer's identity fields. Only `name` and `email` may be
         *     changed here, and both are optional — send whichever you want to update.
         *
         *     Billing-address details (company name, tax ID, street, city, country,
         *     etc.) are not supported by this endpoint and are ignored; amend those
         *     through the hosted billing-update flow, which validates tax-relevant
         *     data centrally so invoices stay accurate.
         *
         *     An `email` is canonicalized before it is stored, so the address you read
         *     back may differ in spelling from the one you sent. Moving a customer onto
         *     an address another customer in the same storefront and mode already holds
         *     returns `422`.
         */
        patch: operations["updateCustomer"];
        trace?: never;
    };
    "/customers/{customerId}/portal-sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a hosted customer portal session
         * @description Use this endpoint when a signed-in customer clicks "manage billing",
         *     "manage subscription", or a similar action in your own app.
         *
         *     **Customer portal flow:**
         *
         *     1. Find or create the customer with `GET /v1/customers?email=...` or
         *        `POST /v1/customers`.
         *     2. Create a portal session with this endpoint.
         *     3. Redirect the customer's browser to the `url` returned in the response.
         *
         *     The returned URL is a short-lived, single-use entry link to Vatly's hosted
         *     customer portal. The portal lets the customer view invoices and manage
         *     subscriptions for this API token's storefront, including opening invoice
         *     history, viewing subscriptions, updating eligible payment methods, and
         *     canceling an active subscription. Customers with one-off purchases and no
         *     subscription can use the portal for their invoice history.
         *
         *     The session is locked to the customer, storefront, merchant, and live/test
         *     mode represented by the API token. A token for one storefront cannot issue
         *     a portal link for another storefront, and the request body cannot override
         *     `testmode`. For a merchant with multiple storefronts, each API token
         *     issues portal links for its own storefront.
         *
         *     Portal sessions are available only for customers that are active, not
         *     archived, have a usable email address, belong to the authenticated API
         *     token's storefront and mode, and have at least one issued invoice in that
         *     storefront and mode. Invoices remain eligible after a refund or
         *     chargeback; a subscription without an issued invoice does not grant
         *     access. If those conditions are not met, Vatly returns `404`.
         *
         *     The request body may be omitted or sent as `{}`. Send `returnUrl` in the
         *     JSON body, not as a query parameter, when you want the hosted portal to
         *     show a link back to your app. `returnUrl` must be an absolute HTTPS URL
         *     without embedded credentials; Vatly displays it as a customer-clicked link
         *     and never fetches or automatically redirects to it.
         *
         *     The link expires after roughly 15 minutes by default and can be consumed
         *     once. Use an `Idempotency-Key` for safe retries while creating the
         *     session. If an idempotent replay returns a URL that the customer already
         *     consumed, request a replacement with a fresh key.
         */
        post: operations["createCustomerPortalSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{customerId}/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List customer subscriptions
         * @description Returns a paginated list of subscriptions for a specific customer.
         *     Includes subscriptions in all states (active, canceled, etc.).
         */
        get: operations["listCustomerSubscriptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/customers/{customerId}/subscriptions/{subscriptionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a customer subscription
         * @description Retrieves a specific subscription for a customer.
         *     The subscription must belong to the specified customer.
         */
        get: operations["getCustomerSubscription"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/one-off-products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all one-off products
         * @description Returns a paginated list of one-off products for the authenticated merchant.
         *     Results are filtered by the testmode determined from the API token.
         *
         *     Only products with `active` status can be used in checkouts.
         *
         *     Archived products are excluded unless `includeArchived=true` is passed.
         */
        get: operations["listOneOffProducts"];
        put?: never;
        /**
         * Create a one-off product
         * @description Creates a new one-off product for the authenticated merchant, in the
         *     testmode determined from the API token.
         *
         *     A product created with a `live_` token starts in `pending` status and
         *     must be approved by Vatly before it can be used in checkouts — the same
         *     review that applies to products created in the dashboard. A product
         *     created with a `test_` token is auto-approved (`active`) so you can trial
         *     checkout immediately.
         */
        post: operations["createOneOffProduct"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/one-off-products/{oneOffProductId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a one-off product
         * @description Retrieves a specific one-off product by its ID.
         */
        get: operations["getOneOffProduct"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Request an update to a one-off product
         * @description Submits an update to a live one-off product. Because products drive
         *     VAT-bearing sales, the change is held as a pending update and reviewed by
         *     Vatly before it takes effect (`updateStatus` moves `pending` → `reviewing`
         *     → applied). In test mode the update is approved automatically.
         *
         *     Each request is the **complete set of changes** relative to the current
         *     live product. Fields equal to the live value are ignored, and a request
         *     that nets to no change clears any pending update. A new request replaces
         *     the not-yet-reviewed one; while an update is being reviewed, further
         *     requests return `409`.
         */
        patch: operations["updateOneOffProduct"];
        trace?: never;
    };
    "/one-off-products/{oneOffProductId}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Archive a one-off product
         * @description Takes the product out of your sellable catalogue. It is hidden from
         *     `GET /v1/one-off-products` (unless `includeArchived=true`) and refused by
         *     `POST /v1/checkouts`; existing orders and refunds are untouched.
         *
         *     Archiving applies to *new* checkouts only. A checkout created before the
         *     product was archived snapshots its product data at creation time and can
         *     still be completed — the same window that applies when a product is
         *     rejected after a checkout was opened.
         *
         *     Nothing is deleted — the product remains readable by id, now carrying a
         *     non-null `archivedAt`. Archiving is not queued behind Vatly's product
         *     review, and leaves any pending update in place. Repeating the request is
         *     a no-op that returns `204` and does not move `archivedAt`.
         *     Reverse it with `DELETE /v1/one-off-products/{oneOffProductId}/archive`.
         */
        post: operations["archiveOneOffProduct"];
        /**
         * Unarchive a one-off product
         * @description Puts an archived product back on sale: it reappears in
         *     `GET /v1/one-off-products` and can be added to checkouts again. Calling
         *     it on a product that is not archived is a no-op.
         */
        delete: operations["unarchiveOneOffProduct"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscription-plans": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all subscription plans
         * @description Returns a paginated list of subscription plans for the authenticated merchant.
         *     Results are filtered by the testmode determined from the API token.
         *
         *     Only plans with `active` status can be used in checkouts.
         *
         *     Archived plans are excluded unless `includeArchived=true` is passed.
         */
        get: operations["listSubscriptionPlans"];
        put?: never;
        /**
         * Create a subscription plan
         * @description Creates a new subscription plan for the authenticated merchant, in the
         *     testmode determined from the API token.
         *
         *     A plan created with a `live_` token starts in `pending` status and must be
         *     approved by Vatly before it can be used in checkouts — the same review
         *     that applies to plans created in the dashboard. A plan created with a
         *     `test_` token is auto-approved (`active`) so you can trial checkout
         *     immediately.
         *
         *     Constraints:
         *     - `productType` must be `saas` (e-books are one-off purchases and cannot
         *       be sold on a recurring basis).
         *     - The `day` interval is sandbox-only; live plans support `week`, `month`,
         *       and `year`.
         *     - `intervalCount` is bounded per unit: up to 365 days, 52 weeks, or 12
         *       months. `year` always bills once per year (`intervalCount` is ignored).
         */
        post: operations["createSubscriptionPlan"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscription-plans/{subscriptionPlanId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a subscription plan
         * @description Retrieves a specific subscription plan by its ID.
         */
        get: operations["getSubscriptionPlan"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Request an update to a subscription plan
         * @description Submits an update to a live subscription plan. Because plans drive
         *     VAT-bearing recurring sales, the change is held as a pending update and
         *     reviewed by Vatly before it takes effect (`updateStatus` moves `pending` →
         *     `reviewing` → applied). In test mode the update is approved automatically.
         *
         *     Each request is the **complete set of changes** relative to the current
         *     live plan. Fields equal to the live value are ignored, and a request that
         *     nets to no change clears any pending update. A new request replaces the
         *     not-yet-reviewed one; while an update is being reviewed, further requests
         *     return `409`. Changing the interval on a plan that has ever been used by a
         *     subscription — active or not — also returns `409`. The price stays
         *     changeable.
         */
        patch: operations["updateSubscriptionPlan"];
        trace?: never;
    };
    "/subscription-plans/{subscriptionPlanId}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Archive a subscription plan
         * @description Closes the plan to new business. It is hidden from
         *     `GET /v1/subscription-plans` (unless `includeArchived=true`), refused by
         *     `POST /v1/checkouts`, and can no longer be switched to from
         *     `PATCH /v1/subscriptions/{subscriptionId}`.
         *
         *     Subscribers already on the plan are deliberately untouched: a
         *     subscription snapshots its plan at signup and renews off that snapshot,
         *     so archiving never cancels anyone or changes what they are billed. To end
         *     a subscription, cancel it with `DELETE /v1/subscriptions/{subscriptionId}`.
         *
         *     Likewise a checkout created before the plan was archived snapshots its
         *     product data at creation time and can still be completed. Archiving
         *     applies to *new* checkouts only.
         *
         *     Nothing is deleted — the plan remains readable by id, now carrying a
         *     non-null `archivedAt`. Repeating the request is a no-op that returns
         *     `204` and does not move `archivedAt`.
         *
         *     Reverse it with `DELETE /v1/subscription-plans/{subscriptionPlanId}/archive`.
         */
        post: operations["archiveSubscriptionPlan"];
        /**
         * Unarchive a subscription plan
         * @description Re-opens an archived plan to new business: it reappears in
         *     `GET /v1/subscription-plans` and can be added to checkouts and switched
         *     to again. Calling it on a plan that is not archived is a no-op.
         */
        delete: operations["unarchiveSubscriptionPlan"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all orders
         * @description Returns a paginated list of orders for the authenticated merchant.
         *     Results are filtered by the testmode determined from the API token.
         */
        get: operations["listOrders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get an order
         * @description Retrieves a specific order by its ID.
         *     Includes full order details with line items, totals, and billing information.
         *     For a paid checkout, follow `Checkout.orderId` and inspect `lines[].relatedResources`.
         *     Signup, renewal and immediate-update lines expose the same subscriptionId.
         *     Product references are unchanged. Neither
         *     creation, a paid order nor an ID alone proves activation or entitlement.
         */
        get: operations["getOrder"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/invoice-update-link": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create invoice update link
         * @description Generates a signed URL that allows the customer to update the invoice details for this order
         *     (billing address, VAT number, company name).
         *
         *     The link is valid for a limited time (typically 24 hours) and can be sent to the customer
         *     to self-service update their invoice.
         *
         *     **Use cases:**
         *     - Customer needs to add/update VAT number
         *     - Customer needs to correct billing address
         *     - Customer needs to change company name on invoice
         */
        post: operations["createOrderInvoiceUpdateLink"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/refunds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List order refunds
         * @description Returns a paginated list of refunds for a specific order.
         *     Includes both pending and completed refunds.
         */
        get: operations["listOrderRefunds"];
        put?: never;
        /**
         * Create a partial refund
         * @description Creates a partial refund for specific items in an order.
         *
         *     **Requirements:**
         *     - Order must have `paid` status
         *     - Order's payment provider must support refunds
         *     - Refund amount per item cannot exceed remaining refundable amount
         *
         *     **Notes:**
         *     - Amounts are specified before taxes; taxes are calculated automatically
         *     - Multiple partial refunds can be created for the same order
         *     - Refunds are processed asynchronously through the payment provider
         */
        post: operations["createOrderRefund"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/refunds/full": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create a full refund
         * @description Creates a full refund for an order, refunding all items.
         *
         *     **Requirements:**
         *     - Order must have `paid` status
         *     - Order's payment provider must support refunds
         *     - Order must not be already fully refunded
         *
         *     **Notes:**
         *     - This is a convenience endpoint; it automatically calculates the full refundable amount
         *     - If partial refunds have already been issued, only the remaining amount is refunded
         */
        post: operations["createFullOrderRefund"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/refunds/{refundId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get an order refund
         * @description Retrieves a specific refund for an order.
         *     The refund must belong to the specified order.
         */
        get: operations["getOrderRefund"];
        put?: never;
        post?: never;
        /**
         * Cancel a refund
         * @description Cancels a pending refund.
         *
         *     **Requirements:**
         *     - Refund must be in `pending` status
         *     - Cannot cancel refunds that have already been processed
         *
         *     **Notes:**
         *     - Once canceled, the refund cannot be restored
         *     - To refund again, create a new refund request
         */
        delete: operations["cancelOrderRefund"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/chargebacks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List order chargebacks
         * @description Returns a paginated list of chargebacks for a specific order.
         *     Most orders have at most one chargeback.
         */
        get: operations["listOrderChargebacks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/chargebacks/{chargebackId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get an order chargeback
         * @description Retrieves a specific chargeback for an order.
         *     The chargeback must belong to the specified order.
         */
        get: operations["getOrderChargeback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/refunds": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all refunds
         * @description Returns a paginated list of all refunds for the authenticated merchant.
         *     Results are filtered by the testmode determined from the API token.
         */
        get: operations["listRefunds"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/refunds/{refundId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a refund
         * @description Retrieves a specific refund by its ID.
         */
        get: operations["getRefund"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chargebacks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all chargebacks
         * @description Returns a paginated list of all chargebacks for the authenticated merchant.
         *     Results are filtered by the testmode determined from the API token.
         *
         *     **Notes:**
         *     - Chargebacks are created automatically by payment provider webhooks
         *     - They cannot be created manually through the API
         */
        get: operations["listChargebacks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/chargebacks/{chargebackId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a chargeback
         * @description Retrieves a specific chargeback by its ID.
         */
        get: operations["getChargeback"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhook-events/{eventId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get webhook event
         * @description Retrieves a specific webhook event by its ID.
         *     Returns the full event payload including the resource data at the time the event occurred.
         */
        get: operations["getWebhookEvent"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhook-endpoints": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List webhook endpoints
         * @description Returns the webhook endpoints for the authenticated merchant, filtered by
         *     the testmode determined from the API token. A storefront can have up to
         *     five endpoints per mode. Each endpoint includes its explicit event
         *     subscriptions; the signing secret is never included.
         */
        get: operations["listWebhookEndpoints"];
        put?: never;
        /**
         * Register a webhook endpoint
         * @description Registers a webhook endpoint for the mode determined by the API token.
         *
         *     You supply the signing `secret`; it is write-only and never returned, so
         *     keep the value you send — you use it to verify the `Vatly-Signature` HMAC
         *     on deliveries.
         *
         *     Vatly sends a `webhook.setup` verification ping to the URL and validates
         *     its SSL certificate; if either fails the request is rejected with `422`.
         *     A storefront may register up to five endpoints in each mode, and each URL
         *     must be unique within that storefront and mode. A duplicate URL or a sixth
         *     endpoint returns `422`.
         *
         *     `enabledEvents` is an explicit snapshot. If omitted, Vatly stores every
         *     event name available at registration time; events introduced later are
         *     not enabled automatically. Send `[]` for a dormant endpoint. The
         *     `webhook.setup` verification event is unconditional and cannot be selected.
         *
         *     **Use cases:**
         *     - Provision an endpoint from CI / infrastructure-as-code
         *     - Point an ephemeral preview environment at its own public URL
         */
        post: operations["createWebhookEndpoint"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/webhook-endpoints/{webhookEndpointId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a webhook endpoint
         * @description Retrieves a webhook endpoint by ID. The signing secret is never included.
         */
        get: operations["getWebhookEndpoint"];
        put?: never;
        post?: never;
        /**
         * Delete a webhook endpoint
         * @description Deletes a webhook endpoint. Vatly stops sending deliveries to it
         *     immediately. To receive events again, register a new endpoint.
         */
        delete: operations["deleteWebhookEndpoint"];
        options?: never;
        head?: never;
        /**
         * Update a webhook endpoint
         * @description Updates a webhook endpoint's `url`, signing `secret`, and/or complete
         *     `enabledEvents` subscription set. A new URL is revalidated for
         *     reachability and a valid SSL certificate just like on creation. The secret
         *     is write-only and is never returned. Omitting `enabledEvents` preserves
         *     the current set; sending `[]` makes the endpoint dormant. Sending an empty
         *     body is a no-op that returns the current endpoint.
         *
         *     Repointing the URL is the supported way to follow an ephemeral
         *     environment whose public URL changes between runs, without rotating the
         *     signing secret.
         */
        patch: operations["updateWebhookEndpoint"];
        trace?: never;
    };
    "/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List all subscriptions
         * @description Returns a paginated list of all subscriptions for the authenticated merchant.
         *     Results are filtered by the testmode determined from the API token.
         *     Includes subscriptions in all states (active, canceled, etc.).
         */
        get: operations["listSubscriptions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions/{subscriptionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a subscription
         * @description Retrieves a specific subscription by its ID.
         */
        get: operations["getSubscription"];
        put?: never;
        post?: never;
        /**
         * Cancel a subscription
         * @description Cancels a subscription.
         *
         *     **Cancellation modes:**
         *     - **Default (grace period):** Subscription remains active until the end of the current billing period, then ends
         *     - **Immediate:** Subscription ends immediately when `immediately=true` is specified
         *
         *     **Notes:**
         *     - A subscription that was canceled with a grace period (the default) can be resumed via
         *       `POST /subscriptions/{subscriptionId}/resume` while its `status` is `on_grace_period`
         *     - A subscription that was canceled immediately cannot be reactivated; create a new subscription instead
         *     - Customers retain access until `renewedUntil` date (unless canceled immediately)
         *     - No refunds are issued automatically; use the Refunds API if needed
         */
        delete: operations["cancelSubscription"];
        options?: never;
        head?: never;
        /**
         * Update a subscription
         * @description Updates a subscription's plan, quantity, price, or billing schedule.
         *
         *     **Plan updates:**
         *     - Specify `subscriptionPlanId` to switch to a different plan
         *     - New plan must match the subscription's testmode
         *
         *     **Quantity updates:**
         *     - Specify `quantity` to set the number of units (e.g., seats). It is
         *       the new total, not an amount to add.
         *
         *     **Price updates:**
         *     - Specify `price` to set a new recurring price while keeping the
         *       current plan. Its currency must match the subscription's currency.
         *     - A `price` sent alongside a `subscriptionPlanId` overrides the new
         *       plan's default price.
         *
         *     **Proration:**
         *     - By default, updates are prorated
         *     - Proration credits unused time and charges for the new plan
         *     - Set `prorationCharge: false` to apply the change now without charging
         *       for it. The next renewal bills the new price, unless a change is
         *       already scheduled for that renewal: that change still applies. It
         *       cannot be combined with `invoiceImmediately: true`, `anchor`,
         *       `resetAnchor`, `trialUntil` or an interval change, which return `422`
         *     - `prorate: false` does not skip the charge: it charges the full new
         *       price for the current cycle, without a credit
         *     - An immediate prorated update (`applyImmediately: true`,
         *       `prorate: true`) that keeps the billing anchor charges the new price
         *       for the time left on the current cycle, minus a credit for the old
         *       price over that same time
         *     - If that charge would be negative, which is the case for any downgrade,
         *       price decrease or seat reduction while time is left on the cycle, the
         *       request is rejected with `422`. The difference is not credited or refunded
         *       mid-cycle
         *     - **Recommended:** schedule the change for the next renewal
         *       (`applyImmediately: false`). The customer keeps their current plan
         *       until the cycle ends, and the lower price takes effect at renewal with
         *       no extra charge
         *     - To switch now without a credit or a charge, set
         *       `prorationCharge: false`
         *     - Only switch immediately without proration (`prorate: false`) if the
         *       customer must lose access to the higher plan right away. This charges
         *       the full price of the new plan for the current cycle, without
         *       crediting what was already paid. It is billed right away with
         *       `invoiceImmediately: true`, otherwise on the next renewal invoice
         *     - An immediate prorated update that moves the anchor (`anchor`,
         *       `resetAnchor`, or a different interval) returns the same `422` when
         *       its charge would be negative
         *
         *     **Timing:**
         *     - By default, updates apply at the end of the current billing period
         *     - Set `applyImmediately: true` to apply immediately
         *     - A subscription whose `status` is `on_grace_period` has no next billing
         *       period — it ends when the current one does. Scheduling an update for it
         *       returns `422`; resume the subscription first, or set
         *       `applyImmediately: true` to apply the change to the remaining period
         *     - An immediate update on an `on_grace_period` subscription may change the
         *       plan, price or quantity for the remaining period, but not when that
         *       period ends. `anchor`, `resetAnchor`, and a plan whose interval differs
         *       from the current one all return `422`, because each would move the
         *       already-communicated end date
         *     - Set `invoiceImmediately: true` to charge proration immediately.
         *       Otherwise the delta is billed as a line on the next renewal invoice,
         *       and is waived if the subscription is cancelled before that renewal.
         *       An immediate update that ends a trial is always charged right away,
         *       unless the subscription is `on_grace_period` (see Trial/Anchor)
         *     - On yearly and other long-interval plans, prefer
         *       `invoiceImmediately: true` — the default defers the delta until the
         *       next renewal, which can be many months away, and waives it if the
         *       customer cancels first
         *
         *     **Trial/Anchor:**
         *     - An immediate update (`applyImmediately: true`) during a trial ends
         *       the trial. Without `anchor`, the first paid cycle starts that day and
         *       is charged right
         *       away at the full new price, whatever `prorate` and
         *       `invoiceImmediately` are set to. The next renewal is one interval
         *       later, not at the original end of the trial. For example, a monthly
         *       plan with a trial until 15 October that is changed on 5 October is
         *       charged on 5 October and renews on 5 November
         *     - With `anchor`, the first paid cycle runs to that date instead. It is
         *       priced per `prorate`, charged right away, and renews on the anchor.
         *       For example, the same plan changed on 5 October with `anchor` set to
         *       20 October is charged for 5 to 20 October (the full monthly price with
         *       `prorate: false`) and renews on 20 October
         *     - A scheduled update (`applyImmediately: false`) keeps the trial; the
         *       new plan, price or quantity applies from the first paid cycle
         *     - An immediate update with `prorationCharge: false` also keeps the
         *       trial. The change applies now, and the trial end bills the new plan
         *     - A subscription whose `status` is `on_grace_period` still ends on its
         *       communicated date: an immediate update ends its trial without
         *       starting a paid cycle, and `invoiceImmediately` applies as usual
         *     - Use `trialUntil` to extend or set a trial period
         *     - Use `anchor` to set the billing anchor to a specific date, or
         *       `resetAnchor: true` to reset it to the current date
         *     - `anchor` and `resetAnchor` are mutually exclusive
         */
        patch: operations["updateSubscription"];
        trace?: never;
    };
    "/subscriptions/{subscriptionId}/billing-update-link": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create billing update link
         * @description Generates a signed URL that allows the customer to update the billing details for this
         *     subscription (billing address, VAT number, company name) via a hosted flow.
         *
         *     **Flow:**
         *     1. Call this endpoint with redirect URLs
         *     2. Redirect customer to the returned URL
         *     3. Customer updates their details on the hosted page
         *     4. Customer is redirected to your success/canceled URL
         *
         *     **Use cases:**
         *     - Customer needs to update billing address
         *     - Customer needs to add/update VAT number
         *     - Self-service invoice detail management
         */
        post: operations["createSubscriptionBillingUpdateLink"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/subscriptions/{subscriptionId}/resume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Resume a canceled subscription
         * @description Resumes a subscription that was previously canceled with a grace period, while it is still
         *     within that grace period.
         *
         *     **When this works:**
         *     - The subscription's `status` is `on_grace_period`
         *
         *       (`endedAt` stays `null` throughout the grace period — it is only set once the
         *       subscription has actually ended, so resumability is keyed off `status`, not `endedAt`.)
         *
         *     **Result:**
         *     - Status returns to `active`
         *     - The existing billing cycle and renewal schedule are preserved (no new charge fires immediately)
         *     - The original payment mandate remains in effect
         *     - A `subscription.resumed` webhook is delivered to your configured endpoint
         *     - `canceledAt` is cleared (`endedAt` was already `null` during the grace period)
         *     - The refreshed subscription is returned in the response body
         *
         *     **When this does NOT work:**
         *     - Subscription was canceled immediately (`status` is `canceled`) — create a new subscription instead
         *     - Grace period has already lapsed (`status` is now `canceled` and `endedAt` is set) — create a new subscription instead
         *     - Subscription is already active (no-op rejected for clarity, not silently ignored)
         */
        post: operations["resumeSubscription"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/test-helpers/subscriptions/{subscriptionId}/fast-forward-renewal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Fast-forward subscription renewal
         * @description Simulates a subscription renewal cycle for testing purposes.
         *
         *     **Requirements:**
         *     - Only available in test mode (requires `test_` prefixed API token)
         *     - Subscription must belong to the authenticated merchant
         *     - Subscription must be active and have a scheduled next renewal
         *
         *     **Use cases:**
         *     - Test renewal billing flows without waiting for the actual billing cycle
         *     - Verify subscription lifecycle events and webhooks
         *     - Exercise your payment-recovery handling by forcing the renewal payment to
         *       fail (`paymentStatus: failed`)
         *     - Reach both recovery timelines by naming the decline: a soft one retries
         *       over weeks, a hard one asks the customer for a new payment method
         *
         *     **Asynchronous, like a live renewal.** The request is checked straight away; the
         *     renewal itself runs from a queue a few seconds later, so the response shows the
         *     subscription as it was before the renewal: `renewedAt`, `renewedUntil`, and
         *     `nextRenewalAt` have not yet changed. Follow
         *     the `order.paid` and `order.payment_failed` webhooks for the outcome, the same
         *     way your live integration should.
         *
         *     When the renewal produces a payment, the helper creates it locally and never
         *     submits a charge to the provider sandbox. When `paymentStatus` is provided,
         *     that status is the deterministic test-mode outcome. When it is omitted, the
         *     local payment remains pending.
         *
         *     After a soft simulated failure, each scheduled payment-recovery retry also
         *     creates a local pending payment without contacting the provider. Use the
         *     order payment simulation helper on that retry's order to settle or decline
         *     it.
         *
         *     Because that payment exists only inside Vatly, it cannot receive a
         *     provider-originated chargeback or dispute. Use a normal provider-backed test
         *     payment when testing chargeback webhooks.
         *
         *     Only one unresolved fast-forward per subscription can exist at a time. A
         *     second request while the first is queued, running, or awaiting exact
         *     recovery returns `409`. If the payment mandate is not active yet, the cycle
         *     still advances. A requested `failed` outcome can start payment recovery
         *     without creating a payment; `paid` cannot be applied until a chargeable
         *     payment exists.
         */
        post: operations["fastForwardSubscriptionRenewal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/test-helpers/orders/{orderId}/simulate-payment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Simulate an order payment outcome
         * @description Settles or declines the pending payment of a test order that was charged to
         *     the customer's saved payment method, such as a subscription renewal or a
         *     subscription update with `invoiceImmediately: true`.
         *
         *     Use this endpoint when a test-mode payment on a saved payment method is
         *     still pending. Test card payments settle as paid right away. Test SEPA
         *     Direct Debit payments are settled as paid automatically 10 to 15 minutes
         *     after they are created, unless you simulate an outcome first: simulate
         *     `failed` within the first 10 minutes to test your payment-recovery handling.
         *     Locally simulated payments created by the fast-forward and payment-recovery
         *     helpers are never settled automatically; they stay pending until you
         *     simulate an outcome.
         *
         *     **Requirements:**
         *     - Only available in test mode (requires `test_` prefixed API token)
         *     - Order must belong to the authenticated merchant
         *     - Order must be charged to a saved payment method and still await payment
         *
         *     **Use cases:**
         *     - Receive `order.paid` for a renewal or an immediately invoiced subscription update
         *     - Exercise your payment-recovery handling (`paymentStatus: failed`), which
         *       delivers `order.payment_failed`
         *
         *     Unlike fast-forward renewal, this does not advance the billing cycle.
         *
         *     **Asynchronous, like a live payment.** The request is checked straight away; the
         *     outcome is applied from a queue a few seconds later, so the returned order is
         *     still awaiting payment. Follow the
         *     `order.paid` / `order.payment_failed` webhooks for the result.
         *
         *     A payment that already completed or failed cannot be simulated again. When the
         *     payment mandate is not active yet, no payment exists: `failed` still starts a
         *     payment recovery, but `paid` is rejected. Only one simulation per order can be
         *     queued at a time; a second request while one is queued returns `409`.
         */
        post: operations["simulateOrderPayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export interface webhooks {
    "order.paid": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Order paid
         * @description An order's payment was successful. `object` is the Order.
         */
        post: operations["onOrderPaid"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "order.canceled": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Order canceled
         * @description An order was canceled. `object` is the Order. When payment recovery for
         *     an unpaid order is exhausted, the order is canceled and carries
         *     `cancellationReason: payment_failure`.
         */
        post: operations["onOrderCanceled"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "order.chargeback_received": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Chargeback received
         * @description A chargeback was received for an order. `entityType` is `order`, but
         *     `object` is the Chargeback.
         */
        post: operations["onOrderChargebackReceived"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "order.chargeback_reversed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Chargeback reversed
         * @description A previously received chargeback was reversed. `entityType` is `order`, but
         *     `object` is the Chargeback.
         */
        post: operations["onOrderChargebackReversed"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "order.payment_failed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Order payment failed
         * @description A payment for this order failed and Vatly's automated payment recovery
         *     (dunning) now covers it. Delivered once per failed order, when the order
         *     enters recovery, and not on each retry attempt. Recovery is per payment
         *     method: if another order on the same payment method fails while recovery
         *     is already running (for example an immediate upgrade charge during a
         *     renewal's recovery), it joins that recovery and you receive a separate
         *     `order.payment_failed` for it. If recovery succeeds you receive
         *     `order.paid` for each recovered order; if it is exhausted the related
         *     subscriptions are canceled. See
         *     "Handling failed subscription payments" in the API overview for the full
         *     recovery flow and the recommended way to gate access.
         *     `entityType` is `order` and `object` is the Order.
         */
        post: operations["onOrderPaymentFailed"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "refund.completed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refund completed
         * @description A refund was processed successfully. `object` is the Refund.
         */
        post: operations["onRefundCompleted"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "refund.failed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refund failed
         * @description A refund failed to process. `object` is the Refund.
         */
        post: operations["onRefundFailed"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "refund.canceled": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Refund canceled
         * @description A refund was canceled before completing. `object` is the Refund.
         */
        post: operations["onRefundCanceled"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription.started": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription started
         * @description A subscription was started. `object` is the Subscription.
         */
        post: operations["onSubscriptionStarted"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription.canceled_immediately": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription canceled immediately
         * @description A subscription was canceled with immediate effect at the merchant's
         *     request. `object` is the Subscription and carries
         *     `cancellationReason: merchant_request`.
         */
        post: operations["onSubscriptionCanceledImmediately"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription.canceled_for_nonpayment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription canceled for nonpayment
         * @description Payment recovery for a failed subscription renewal was exhausted, so the
         *     subscription was canceled with immediate effect. `object` is the
         *     Subscription and carries `cancellationReason: payment_failure`.
         */
        post: operations["onSubscriptionCanceledForNonpayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription.canceled_with_grace_period": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription canceled with grace period
         * @description A subscription was canceled and will remain active until the end of its
         *     grace period. `object` is the Subscription.
         */
        post: operations["onSubscriptionCanceledWithGracePeriod"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription.cancellation_grace_period_completed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription grace period completed
         * @description A canceled subscription's grace period ended and the subscription is now
         *     fully canceled. `object` is the Subscription.
         */
        post: operations["onSubscriptionCancellationGracePeriodCompleted"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription.resumed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription resumed
         * @description A canceled subscription was resumed during its grace period. `object` is
         *     the Subscription.
         */
        post: operations["onSubscriptionResumed"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription.billing_updated": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription billing updated
         * @description A subscription's billing details changed server-side. In practice today
         *     this is the mandate (payment method on file) — e.g. the customer completed
         *     the hosted billing-update flow or the mandate was replaced
         *     customer-service-side. `object` is the Subscription, enriched with the
         *     current mandate (`object.mandate.method` and `object.mandate.maskedIdentifier`).
         *     Use this to refresh the masked payment method identifier you display to the
         *     customer without polling or a follow-up `GET /v1/subscriptions/{id}`.
         */
        post: operations["onSubscriptionBillingUpdated"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription.updated": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription updated
         * @description The subscription resource changed. Fires on immediate changes, when a
         *     scheduled change takes effect at renewal, and when a renewal payment is
         *     confirmed. `object` is the Subscription after the change; the envelope's
         *     `reason` says what changed:
         *
         *     - `updated_immediately`: a plan, price, interval or quantity change took
         *       effect immediately.
         *     - `updated_on_renewal`: a scheduled change (see
         *       `subscription.update_scheduled`) took effect at a renewal. Sent at
         *       renewal time, before the renewal is paid.
         *     - `renewed`: a renewal payment was confirmed, so `renewedAt` and
         *       `renewedUntil` moved. Sent once per renewal.
         *
         *     A renewal that applies a scheduled change therefore sends two events:
         *     `updated_on_renewal` at renewal, then `renewed` once it is paid. Each has
         *     its own stable `Vatly-Event-Id`. Test-mode renewals, including
         *     fast-forwarded ones, send these events too. New `reason` values may be
         *     added; treat an unknown value as a generic change and re-read the
         *     Subscription from `object`.
         */
        post: operations["onSubscriptionUpdated"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription.update_scheduled": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription update scheduled
         * @description A plan/price/quantity change was scheduled to take effect at the
         *     subscription's next billing cycle. `object` is the Subscription as it is
         *     *today* (the change has not applied yet); the scheduled target values are
         *     carried in `object.scheduledUpdate` (`subscriptionPlanId`, `name`,
         *     `description`, `basePrice`, `quantity`, `interval`, `intervalCount`, `effectiveAt`).
         */
        post: operations["onSubscriptionUpdateScheduled"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "checkout.paid": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Checkout paid
         * @description A checkout was paid successfully. `object` is the Checkout.
         */
        post: operations["onCheckoutPaid"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "checkout.failed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Checkout payment failed
         * @description A checkout payment failed. `object` is the Checkout.
         */
        post: operations["onCheckoutFailed"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "checkout.canceled": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Checkout canceled
         * @description A checkout was canceled. `object` is the Checkout.
         */
        post: operations["onCheckoutCanceled"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "checkout.expired": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Checkout expired
         * @description A checkout session expired before being paid. `object` is the Checkout.
         */
        post: operations["onCheckoutExpired"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "webhook.setup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Webhook setup
         * @description Verification call sent when a webhook endpoint is registered or its URL is
         *     changed, to confirm the endpoint is reachable. `entityType` is `webhook` and
         *     `object` is the (secret-free) endpoint config. Acknowledge with any 2xx; no
         *     other action is required. This call is not persisted and is not retried, and
         *     therefore omits the `links` field carried by regular event deliveries.
         */
        post: operations["onWebhookSetup"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "one_off_product.update_submitted": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * One-off product update submitted
         * @description A merchant submitted an update to a one-off product; it is awaiting review.
         *     `object` is the OneOffProduct, with the requested changes in
         *     `object.pendingUpdates` and `object.updateStatus: pending`.
         */
        post: operations["onOneOffProductUpdateSubmitted"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "one_off_product.update_approved": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * One-off product update approved
         * @description A submitted update to a one-off product was approved and is now live.
         *     `object` is the OneOffProduct with the new values applied and
         *     `object.pendingUpdates: null`.
         */
        post: operations["onOneOffProductUpdateApproved"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "one_off_product.update_rejected": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * One-off product update rejected
         * @description A submitted update to a one-off product was rejected. `object` is the
         *     unchanged OneOffProduct with `object.pendingUpdates: null`.
         */
        post: operations["onOneOffProductUpdateRejected"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "one_off_product.archived": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * One-off product archived
         * @description A one-off product was taken out of the sellable catalogue. `object` is
         *     the OneOffProduct with a non-null `object.archivedAt`. It is now hidden
         *     from `GET /v1/one-off-products` and refused by `POST /v1/checkouts`;
         *     checkouts opened before this point are unaffected.
         */
        post: operations["onOneOffProductArchived"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "one_off_product.unarchived": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * One-off product unarchived
         * @description An archived one-off product was put back on sale. `object` is the
         *     OneOffProduct with `object.archivedAt: null`.
         */
        post: operations["onOneOffProductUnarchived"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription_plan.update_submitted": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription plan update submitted
         * @description A merchant submitted an update to a subscription plan; it is awaiting
         *     review. `object` is the SubscriptionPlan, with the requested changes in
         *     `object.pendingUpdates` and `object.updateStatus: pending`.
         */
        post: operations["onSubscriptionPlanUpdateSubmitted"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription_plan.update_approved": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription plan update approved
         * @description A submitted update to a subscription plan was approved and is now live.
         *     `object` is the SubscriptionPlan with the new values applied and
         *     `object.pendingUpdates: null`.
         */
        post: operations["onSubscriptionPlanUpdateApproved"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription_plan.update_rejected": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription plan update rejected
         * @description A submitted update to a subscription plan was rejected. `object` is the
         *     unchanged SubscriptionPlan with `object.pendingUpdates: null`.
         */
        post: operations["onSubscriptionPlanUpdateRejected"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription_plan.archived": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription plan archived
         * @description A subscription plan was closed to new business. `object` is the
         *     SubscriptionPlan with a non-null `object.archivedAt`. It is now hidden
         *     from `GET /v1/subscription-plans`, refused by `POST /v1/checkouts`, and
         *     can no longer be switched to from `PATCH /v1/subscriptions/{subscriptionId}`.
         *     Subscribers already on the plan keep billing unchanged.
         */
        post: operations["onSubscriptionPlanArchived"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "subscription_plan.unarchived": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscription plan unarchived
         * @description An archived subscription plan was re-opened to new business. `object` is
         *     the SubscriptionPlan with `object.archivedAt: null`.
         */
        post: operations["onSubscriptionPlanUnarchived"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export interface components {
    schemas: {
        /** @description Monetary value with currency */
        Money: {
            /**
             * @description The amount as a decimal string. Sent and returned as a string to
             *     preserve precision for financial calculations.
             *
             *     The number of required decimal places is **currency-dependent**: it
             *     equals the currency's ISO 4217 minor-unit count — the same rule the
             *     server enforces via [moneyphp/money](https://github.com/moneyphp/money)'s
             *     `DecimalMoneyParser`. The `(value, currency)` pair is validated
             *     together (see the `oneOf` below); mixing precisions is rejected:
             *
             *     - 2 decimals — EUR, USD (and most currencies): `"10.00"` ✓, `"10"` ✗, `"10.0"` ✗, `"10.000"` ✗
             *     - 0 decimals — e.g. JPY: `"1000"` ✓, `"1000.00"` ✗   *(not yet enabled)*
             *     - 3 decimals — e.g. BHD, KWD, OMR, TND: `"1.000"` ✓, `"1.00"` ✗   *(not yet enabled)*
             *
             *     Because the value is a decimal amount (not minor units), `"1000"`
             *     means one thousand units — valid only for a 0-decimal currency; for
             *     EUR/USD you must write `"1000.00"`.
             * @example 99.99
             */
            value: string;
            /**
             * @description ISO 4217 currency code. Vatly aligns its supported currency set
             *     with its payment provider's; currencies are enabled as PSP support and
             *     downstream tax/FX coverage are in place. More currencies may be added
             *     later.
             * @example EUR
             * @enum {string}
             */
            currency: "EUR" | "USD";
        } & ({
            currency?: unknown;
            value?: unknown;
        } | {
            /** @enum {unknown} */
            currency?: "BIF" | "CLP" | "DJF" | "GNF" | "ISK" | "JPY" | "KMF" | "KRW" | "PYG" | "RWF" | "UGX" | "VND" | "VUV" | "XAF" | "XOF" | "XPF";
            value?: unknown;
        } | {
            /** @enum {unknown} */
            currency?: "BHD" | "IQD" | "JOD" | "KWD" | "LYD" | "OMR" | "TND";
            value?: unknown;
        });
        /**
         * @description Monetary value in EUR. Used where the API currently accepts EUR prices
         *     only: catalog prices and checkout price overrides. The `value` takes
         *     exactly two decimals.
         */
        EurMoney: {
            /**
             * @description The amount as a decimal string with exactly two decimals.
             * @example 99.99
             */
            value: string;
            /**
             * @description ISO 4217 currency code. Only `EUR` is accepted.
             * @example EUR
             * @enum {string}
             */
            currency: "EUR";
        };
        /** @description HATEOAS link to a related resource */
        Link: {
            /**
             * Format: uri
             * @description URL of the linked resource
             * @example https://api.vatly.com/v1/orders/order_Hn5xWqVfKm8RjTgYbUcP
             */
            href: string;
            /**
             * @description Content type of the linked resource.
             *     - `application/json` for API resources
             *     - `text/html` for hosted pages
             * @example application/json
             * @enum {string}
             */
            type: "application/json" | "text/html";
        };
        /** @description Customer or merchant billing address */
        BillingAddress: {
            /**
             * @description Full name of the person or contact
             * @example John Doe
             */
            fullName?: string | null;
            /**
             * @description Company or organization name
             * @example Acme Corp
             */
            companyName?: string | null;
            /**
             * @description Tax identification number for tax purposes
             * @example NL123456789B01
             */
            taxId?: string | null;
            /**
             * @description Street address including building number
             * @example 123 Main Street
             */
            streetAndNumber?: string | null;
            /**
             * @description Additional address information (apartment, suite, etc.)
             * @example Suite 456
             */
            streetAdditional?: string | null;
            /**
             * @description City name
             * @example Amsterdam
             */
            city?: string | null;
            /**
             * @description State, province, or region
             * @example North Holland
             */
            region?: string | null;
            /**
             * @description Postal or ZIP code
             * @example 1012 AB
             */
            postalCode?: string | null;
            /**
             * @description ISO 3166-1 alpha-2 country code
             * @example NL
             */
            country?: string | null;
        };
        /** @description Complete billing details including address and contact information */
        BillingDetails: {
            /**
             * @description Full name of the person or contact
             * @example John Doe
             */
            fullName?: string | null;
            /**
             * @description Company or organization name
             * @example Acme Corp
             */
            companyName?: string | null;
            /**
             * @description Tax identification number
             * @example NL123456789B01
             */
            taxId?: string | null;
            /**
             * @description Street address including building number
             * @example 123 Main Street
             */
            streetAndNumber?: string | null;
            /**
             * @description Additional address information
             * @example Suite 456
             */
            streetAdditional?: string | null;
            /**
             * @description City name
             * @example Amsterdam
             */
            city?: string | null;
            /**
             * @description State, province, or region
             * @example North Holland
             */
            region?: string | null;
            /**
             * @description Postal or ZIP code
             * @example 1012 AB
             */
            postalCode?: string | null;
            /**
             * @description ISO 3166-1 alpha-2 country code
             * @example NL
             */
            country?: string | null;
            /**
             * Format: email
             * @description Email address.
             *     Internationalized domains must use their Punycode (ASCII) form
             *     per RFC 3492 — e.g. `billing@xn--mller-kva.de`.
             * @example billing@acme.com
             */
            email?: string | null;
        };
        /**
         * @description Arbitrary key-value metadata for your application.
         *     Up to 50 keys, with key names up to 40 characters and values up to 500 characters.
         * @example {
         *       "orderId": "internal-12345",
         *       "campaign": "summer-sale"
         *     }
         */
        Metadata: {
            [key: string]: string;
        } | null;
        /** @description Pagination links for navigating list results */
        PaginationLinks: {
            /** @description Link to the current page */
            self: components["schemas"]["Link"];
            /** @description Link to the next page (null if on the last page) */
            next?: components["schemas"]["Link"] | null;
            /** @description Link to the previous page (null if on the first page) */
            prev?: components["schemas"]["Link"] | null;
        };
        /**
         * @description Standard error response.
         *
         *     Every non-validation error path returns this shape — `message` is
         *     always present, and `details` (if present) is an object carrying
         *     structured context attached by the originating exception. HTTP
         *     status code is the primary programmatic discriminator.
         */
        Error: {
            /**
             * @description Human-readable error message
             * @example The requested resource was not found.
             */
            message: string;
            /**
             * @description Optional structured context attached by the originating exception.
             *     Shape depends on the specific error case; clients should treat
             *     unknown keys as forward-compatible additions and rely on the HTTP
             *     status code for branching logic.
             * @example {
             *       "resource_type": "checkout",
             *       "resource_id": "checkout_abc123"
             *     }
             */
            details?: {
                [key: string]: unknown;
            };
        };
        /** @description Validation error response with field-specific errors */
        ValidationError: {
            /**
             * @description General validation error message
             * @example The given data was invalid.
             */
            message: string;
            /**
             * @description Field-specific validation errors.
             *     Keys are field names (using dot notation for nested fields).
             *     Values are arrays of error messages.
             * @example {
             *       "email": [
             *         "The email field is required."
             *       ],
             *       "products.0.id": [
             *         "The selected products.0.id is invalid."
             *       ]
             *     }
             */
            errors: {
                [key: string]: string[];
            };
        };
        /**
         * @description A checkout session represents a hosted payment flow.
         *     Customers are redirected to the checkout URL to complete their purchase.
         */
        Checkout: {
            /**
             * @description Unique identifier for the checkout
             * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
             */
            id: string;
            /**
             * @description Resource type identifier (enum property replaced by openapi-typescript)
             * @enum {string}
             */
            resource: "checkout";
            /**
             * @description ID of the customer associated with this checkout.
             *     Null until a customer has been associated (for an anonymous
             *     checkout this happens when the buyer completes payment).
             * @example customer_7kBmRtPvXw2NjLhYcZaE
             */
            customerId: string | null;
            /**
             * @description ID of the order created from this checkout. Always present in the
             *     payload; `null` until the checkout completes, then set to the created
             *     order id.
             * @example order_Tk7mNvBxKw2RjTgYcZaE
             */
            orderId: string | null;
            /**
             * @description Whether this checkout is in test mode
             * @example false
             */
            testmode: boolean;
            /**
             * Format: uri
             * @description URL to redirect customers after successful payment
             * @example https://example.com/success
             */
            redirectUrlSuccess: string;
            /**
             * Format: uri
             * @description URL to redirect customers if they cancel the checkout
             * @example https://example.com/canceled
             */
            redirectUrlCanceled: string;
            metadata: components["schemas"]["Metadata"];
            /**
             * @description The language you asked the hosted checkout to be presented in, as sent on
             *     creation. `null` means you did not specify one, and the checkout picks a
             *     language from the shopper's browser.
             * @example de
             * @enum {string|null}
             */
            locale: "en" | "de" | "fr" | "nl" | "es" | "it" | "pt" | "pl" | null;
            /**
             * @description Current status of the checkout:
             *     - `created` - Checkout is active and awaiting payment
             *     - `paid` - Payment successful, order created
             *     - `canceled` - Checkout was canceled by the customer
             *     - `failed` - Payment failed
             *     - `expired` - Checkout expired without completion
             * @example created
             * @enum {string}
             */
            status: "created" | "paid" | "canceled" | "failed" | "expired";
            /**
             * Format: date-time
             * @description When this checkout will expire (ISO 8601 format)
             * @example 2024-01-15T14:30:00Z
             */
            expiresAt?: string | null;
            /**
             * Format: date-time
             * @description When this checkout was created (ISO 8601 format)
             * @example 2024-01-15T10:30:00Z
             */
            createdAt: string;
            /** @description HATEOAS links to related resources */
            links: {
                /** @description Hosted checkout page URL (text/html) */
                checkoutUrl: components["schemas"]["Link"];
                /** @description Link to this checkout resource */
                self: components["schemas"]["Link"];
                /** @description Link to the created order. Always present; `null` until the checkout completes. */
                order: components["schemas"]["Link"] | null;
            };
        };
        /** @description A product to add to the checkout */
        CheckoutProduct: {
            /**
             * @description Product identifier. Must be either:
             *     - A one-off product ID (starts with `one_off_product_`)
             *     - A subscription plan ID (starts with `subscription_plan_`)
             * @example one_off_product_Vr8kQdFhSrG4Y3DnfsdqH
             */
            id: string;
            /**
             * @description Number of units to purchase
             * @default 1
             * @example 2
             */
            quantity?: number;
            /**
             * @description Custom price override for this product, in EUR. If not provided, the
             *     product's default price is used.
             *
             *     Currently only EUR is accepted; any other currency returns a `422`.
             *     When the customer pays in another currency, the amount is converted
             *     from this EUR price at checkout. For a subscription, the converted
             *     amount and currency are then fixed, so renewals charge the same amount.
             */
            price?: components["schemas"]["EurMoney"] | null;
            /**
             * @description Trial period in days for subscription plans.
             *     Only applicable when `id` references a subscription plan.
             * @example 14
             */
            trialDays?: number | null;
            metadata?: components["schemas"]["Metadata"];
        };
        /** @description Request body for creating a new checkout */
        CreateCheckoutRequest: {
            /**
             * @description URL to redirect customers after successful payment.
             *
             *     You may include the literal `{CHECKOUT_ID}` placeholder anywhere in the
             *     URL (e.g. `https://example.com/return?checkout_id={CHECKOUT_ID}`). Vatly
             *     substitutes it with this checkout's id at creation time, so the host can
             *     learn the checkout id on the redirect back without any server-side token
             *     store. Only `{CHECKOUT_ID}` is supported.
             * @example https://example.com/return?checkout_id={CHECKOUT_ID}
             */
            redirectUrlSuccess: string;
            /**
             * @description URL to redirect customers if they cancel the checkout.
             *
             *     Supports the same `{CHECKOUT_ID}` placeholder as `redirectUrlSuccess`.
             * @example https://example.com/canceled?checkout_id={CHECKOUT_ID}
             */
            redirectUrlCanceled: string;
            /**
             * @description Existing customer ID to associate with this checkout.
             *     If provided, the customer's email will be pre-filled.
             *     Must match the testmode of the API token.
             * @example customer_7kBmRtPvXw2NjLhYcZaE
             */
            customerId?: string | null;
            /**
             * @description Optional editable prefill for the billing address fields on the hosted
             *     checkout. When `country` is supplied, it takes precedence over the
             *     shopper's IP address for determining their country. A supplied `taxId`
             *     is only a prefill; it is not registered until the buyer submits the
             *     checkout.
             */
            billingAddress?: components["schemas"]["BillingAddress"];
            metadata?: components["schemas"]["Metadata"];
            /**
             * @description Language to present the hosted checkout in, including its validation and
             *     error messages. Set this when you already know the customer's language —
             *     it is a better signal than their browser's.
             *
             *     Send a bare language code (`de`), a BCP 47 tag (`de-AT`), or a POSIX /
             *     ISO 15897 locale (`de_DE`) — whichever your stack already stores. All
             *     three are folded to the language, so `de`, `de-AT` and `de_DE` are the
             *     same request. There are no region-specific variants: an Austrian and a
             *     German customer are both served `de`.
             *
             *     The language also carries through to the payment provider's own hosted
             *     page, in whatever format that provider expects.
             *
             *     Supported languages: `en`, `de`, `fr`, `nl`, `es`, `it`, `pt`, `pl`.
             *     Anything else is a `422` naming the supported set.
             *
             *     Omit it (or send `null`) to detect the language from the shopper's
             *     `Accept-Language` header, falling back to English. A shopper can always
             *     override your choice with the checkout's own language switcher.
             *
             *     The response echoes back the folded language, not the string you sent.
             * @example de
             */
            locale?: string | null;
            /**
             * @description Products to include in this checkout
             * @example [
             *       {
             *         "id": "one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
             *         "quantity": 1
             *       },
             *       {
             *         "id": "subscription_plan_Rk5pQrSvWm8NjLhYbUcP",
             *         "trialDays": 14
             *       }
             *     ]
             */
            products: components["schemas"]["CheckoutProduct"][];
        };
        /**
         * @description A customer represents a person or organization that can make purchases.
         *     Email addresses are scoped to a storefront and testmode, so the same
         *     address exists as separate customers in test and live mode.
         */
        Customer: {
            /**
             * @description Unique identifier for the customer
             * @example customer_7kBmRtPvXw2NjLhYcZaE
             */
            id: string;
            /**
             * @description Resource type identifier
             * @example customer
             * @constant
             */
            resource: "customer";
            /**
             * @description Whether this customer is in test mode
             * @example false
             */
            testmode: boolean;
            /**
             * Format: email
             * @description Customer's email address.
             *     Internationalized domains are stored and returned in their
             *     Punycode (ASCII) form per UTS #46 — e.g. `user@xn--mller-kva.de`.
             *     Convert back to Unicode for display in your own UI.
             * @example customer@example.com
             */
            email: string;
            /**
             * @description Customer's display / account-holder name. This is an identity field
             *     for communication (dunning emails, dashboard) — it is distinct from,
             *     and does not affect, the billing name on invoices.
             * @example John Doe
             */
            name: string | null;
            /**
             * Format: date-time
             * @description When this customer was created (ISO 8601 format)
             * @example 2024-01-15T10:30:00Z
             */
            createdAt: string;
            metadata: components["schemas"]["Metadata"];
            /** @description HATEOAS links to related resources */
            links: {
                /** @description Link to this customer resource */
                self: components["schemas"]["Link"];
            };
        };
        /** @description Request body for creating a new customer */
        CreateCustomerRequest: {
            /**
             * Format: email
             * @description Customer's email address. Submit it in any form: the local part is
             *     lower-cased and an internationalized domain is converted to its
             *     Punycode (ASCII) form per UTS #46, so `User@Müller.de` is stored and
             *     returned as `user@xn--mller-kva.de`.
             *
             *     An address another customer in this storefront and testmode already
             *     holds is not an error — that customer is returned with `200`.
             * @example customer@example.com
             */
            email: string;
            /**
             * @description Customer's display / account-holder name.
             * @example John Doe
             */
            name?: string | null;
            metadata?: components["schemas"]["Metadata"];
        };
        /**
         * @description A one-off product represents a single-purchase item.
         *     Products are configured in the Vatly dashboard and can be added to checkouts.
         */
        OneOffProduct: {
            /**
             * @description Unique identifier for the product (always starts with `one_off_product_`)
             * @example one_off_product_Vr8kQdFhSrG4Y3DnfsdqH
             */
            id: string;
            /**
             * @description Resource type identifier (enum property replaced by openapi-typescript)
             * @enum {string}
             */
            resource: "one_off_product";
            /**
             * @description Whether this product is in test mode
             * @example false
             */
            testmode: boolean;
            /**
             * @description Display name of the product
             * @example Premium License
             */
            name: string;
            /**
             * @description Detailed description of the product
             * @example Lifetime access to all premium features
             */
            description: string;
            /**
             * @description Default price of the product (can be overridden in checkout).
             *     Interpretation depends on `taxBehavior`:
             *     - `exclusive` → `basePrice` is the net amount; tax is added at checkout.
             *     - `inclusive` → `basePrice` already includes tax; net is back-computed from the buyer's jurisdiction.
             */
            basePrice: components["schemas"]["Money"];
            /**
             * @description Whether `basePrice` is tax-exclusive (B2B convention; tax added on top at checkout)
             *     or tax-inclusive (B2C convention; price already includes tax).
             *     Immutable after product creation. A checkout may not mix products with different
             *     `taxBehavior` values; doing so returns `422 Unprocessable Entity`.
             * @example exclusive
             * @enum {string}
             */
            taxBehavior: "exclusive" | "inclusive";
            /**
             * @description What kind of product this is:
             *     - `saas` — software supplied as a service (hosted, licensed or otherwise
             *       delivered online)
             *     - `ebook` — an electronic publication supplied as a download or stream
             *
             *     Set when the product is created. Subscription plans accept `saas` only;
             *     an e-book is a one-time purchase, so sell it as a one-off product.
             * @example saas
             * @enum {string}
             */
            productType: "saas" | "ebook";
            /**
             * @description Current status of the product:
             *     - `active` - Product is active and can be purchased
             *     - `pending` - Product is awaiting approval
             *     - `rejected` - Product has been rejected
             * @example active
             * @enum {string}
             */
            status: "active" | "pending" | "rejected";
            /**
             * Format: date-time
             * @description When this product was archived (ISO 8601), or `null` while it is on
             *     sale. Always present. An archived product is hidden from
             *     `GET /v1/one-off-products` and refused by `POST /v1/checkouts`; restore
             *     it with `DELETE /v1/one-off-products/{oneOffProductId}/archive`.
             * @example null
             */
            archivedAt: string | null;
            /**
             * @description The changes that will take effect once a submitted update is approved, or
             *     `null` when there is no pending update. Only the fields that actually
             *     differ from the live product are present.
             * @example {
             *       "basePrice": {
             *         "currency": "EUR",
             *         "value": "349.00"
             *       }
             *     }
             */
            pendingUpdates?: {
                /** @example Premium License v2 */
                name?: string;
                /** @example Now with more premium */
                description?: string;
                basePrice?: components["schemas"]["Money"];
                /** @enum {string} */
                productType?: "saas" | "ebook";
            } | null;
            /**
             * @description Lifecycle of a pending update, or `null` when there is none:
             *     - `pending` - An update was submitted and is awaiting review
             *     - `reviewing` - The update is being reviewed
             * @example null
             * @enum {string|null}
             */
            updateStatus?: "pending" | "reviewing" | null;
            /**
             * Format: date-time
             * @description When this product was created (ISO 8601 format)
             * @example 2024-01-15T10:30:00Z
             */
            createdAt: string;
            /** @description HATEOAS links to related resources */
            links: {
                /** @description Link to this product resource */
                self: components["schemas"]["Link"];
            };
        };
        /** @description Request body for creating a one-off product. */
        CreateOneOffProductRequest: {
            /**
             * @description Display name of the product.
             * @example Premium License
             */
            name: string;
            /**
             * @description Detailed description of the product.
             * @example Lifetime access to all premium features
             */
            description: string;
            /** @description Price of the product, in EUR. */
            basePrice: components["schemas"]["EurMoney"];
            /**
             * @description What kind of product this is:
             *     - `saas` — software supplied as a service (hosted, licensed or otherwise
             *       delivered online)
             *     - `ebook` — an electronic publication supplied as a download or stream
             *
             *     Set when the product is created. Subscription plans accept `saas` only;
             *     an e-book is a one-time purchase, so sell it as a one-off product.
             * @example saas
             * @enum {string}
             */
            productType: "saas" | "ebook";
            /**
             * @description Whether `basePrice` is tax-exclusive (B2B convention) or tax-inclusive
             *     (B2C convention). Optional; defaults to `exclusive`. Immutable after
             *     product creation.
             * @default exclusive
             * @example exclusive
             * @enum {string}
             */
            taxBehavior?: "exclusive" | "inclusive";
        };
        /**
         * @description A subscription plan defines recurring billing terms.
         *     Plans are configured in the Vatly dashboard and can be added to checkouts.
         */
        SubscriptionPlan: {
            /**
             * @description Unique identifier for the plan (always starts with `subscription_plan_`)
             * @example subscription_plan_Wt5mNvBxKw7YcZaEjLhR
             */
            id: string;
            /**
             * @description Resource type identifier (enum property replaced by openapi-typescript)
             * @enum {string}
             */
            resource: "subscription_plan";
            /**
             * @description Whether this plan is in test mode
             * @example false
             */
            testmode: boolean;
            /**
             * @description Display name of the plan
             * @example Pro Monthly
             */
            name: string;
            /**
             * @description Detailed description of the plan
             * @example Full access to all Pro features, billed monthly
             */
            description: string;
            /**
             * @description Price per billing interval.
             *     Interpretation depends on `taxBehavior`:
             *     - `exclusive` → `basePrice` is the net amount; tax is added at checkout.
             *     - `inclusive` → `basePrice` already includes tax; net is back-computed from the buyer's jurisdiction.
             */
            basePrice: components["schemas"]["Money"];
            /**
             * @description Whether `basePrice` is tax-exclusive (B2B convention) or tax-inclusive (B2C convention).
             *     Immutable after plan creation — create a new plan for the other mode. A checkout may not
             *     mix products with different `taxBehavior` values; doing so returns
             *     `422 Unprocessable Entity`.
             * @example exclusive
             * @enum {string}
             */
            taxBehavior: "exclusive" | "inclusive";
            /**
             * @description Billing interval unit:
             *     - `day` - Daily billing
             *     - `week` - Weekly billing
             *     - `month` - Monthly billing
             *     - `year` - Yearly billing
             * @example month
             * @enum {string}
             */
            interval: "day" | "week" | "month" | "year";
            /**
             * @description Number of interval units between billing cycles.
             *     For example, `interval: month` with `intervalCount: 3` bills every 3 months.
             * @example 1
             */
            intervalCount: number;
            /**
             * @description What kind of product this plan sells. Only `saas` is available on a
             *     subscription plan — an e-book is a one-time purchase, so sell it as a
             *     one-off product instead.
             *
             *     Set when the plan is created.
             * @example saas
             * @enum {string}
             */
            productType: "saas";
            /**
             * @description Current status of the plan:
             *     - `active` - Plan is active and can be subscribed to
             *     - `pending` - Plan is awaiting approval
             *     - `rejected` - Plan has been rejected
             * @example active
             * @enum {string}
             */
            status: "active" | "pending" | "rejected";
            /**
             * Format: date-time
             * @description When this plan was archived (ISO 8601), or `null` while it is open to
             *     new business. Always present. An archived plan is hidden from
             *     `GET /v1/subscription-plans`, refused by `POST /v1/checkouts`, and
             *     cannot be switched to from `PATCH /v1/subscriptions/{subscriptionId}`.
             *     Subscribers already on the plan keep billing unchanged. Restore it with
             *     `DELETE /v1/subscription-plans/{subscriptionPlanId}/archive`.
             * @example null
             */
            archivedAt: string | null;
            /**
             * @description The changes that will take effect once a submitted update is approved, or
             *     `null` when there is no pending update. Only the fields that actually
             *     differ from the live plan are present.
             * @example {
             *       "interval": "week",
             *       "intervalCount": 1
             *     }
             */
            pendingUpdates?: {
                /** @example Pro Weekly */
                name?: string;
                /** @example Billed weekly */
                description?: string;
                basePrice?: components["schemas"]["Money"];
                /** @enum {string} */
                interval?: "day" | "week" | "month" | "year";
                intervalCount?: number;
                /** @enum {string} */
                productType?: "saas";
            } | null;
            /**
             * @description Lifecycle of a pending update, or `null` when there is none:
             *     - `pending` - An update was submitted and is awaiting review
             *     - `reviewing` - The update is being reviewed
             * @example null
             * @enum {string|null}
             */
            updateStatus?: "pending" | "reviewing" | null;
            /**
             * Format: date-time
             * @description When this plan was created (ISO 8601 format)
             * @example 2024-01-15T10:30:00Z
             */
            createdAt: string;
            /** @description HATEOAS links to related resources */
            links: {
                /** @description Link to this plan resource */
                self: components["schemas"]["Link"];
            };
        };
        /** @description Request body for creating a subscription plan. */
        CreateSubscriptionPlanRequest: {
            /**
             * @description Display name of the plan.
             * @example Pro Monthly
             */
            name: string;
            /**
             * @description Detailed description of the plan.
             * @example Full access to all Pro features, billed monthly
             */
            description: string;
            /** @description Price per billing interval, in EUR. */
            basePrice: components["schemas"]["EurMoney"];
            /**
             * @description What kind of product this plan sells. Only `saas` is available on a
             *     subscription plan — an e-book is a one-time purchase, so sell it as a
             *     one-off product instead.
             *
             *     Set when the plan is created.
             * @example saas
             * @enum {string}
             */
            productType: "saas";
            /**
             * @description Whether `basePrice` is tax-exclusive (B2B convention) or tax-inclusive
             *     (B2C convention). Optional; defaults to `exclusive`. Immutable after
             *     plan creation — create a new plan for the other mode.
             * @default exclusive
             * @example exclusive
             * @enum {string}
             */
            taxBehavior?: "exclusive" | "inclusive";
            /**
             * @description Billing interval unit. `day` is sandbox-only (test mode); live plans
             *     support `week`, `month`, and `year`.
             * @example month
             * @enum {string}
             */
            interval: "day" | "week" | "month" | "year";
            /**
             * @description Number of interval units between billing cycles. Bounded per unit:
             *     up to 365 days, 52 weeks, or 12 months. For `year`, billing is always
             *     annual and this value is ignored.
             * @example 1
             */
            intervalCount: number;
        };
        /**
         * @description An order represents a completed purchase.
         *     Orders are created when checkouts complete or subscriptions renew.
         */
        Order: {
            /**
             * @description Unique identifier for the order
             * @example order_Hn5xWqVfKm8RjTgYbUcP
             */
            id: string;
            /**
             * @description Resource type identifier (enum property replaced by openapi-typescript)
             * @enum {string}
             */
            resource: "order";
            /**
             * @description ID of the customer who made this purchase. Always present; `null` for orders with no associated customer.
             * @example customer_Lp3mNvBxKw7RjTgYcZaE
             */
            customerId: string | null;
            /**
             * @description Whether this order is in test mode
             * @example false
             */
            testmode: boolean;
            metadata: components["schemas"]["Metadata"];
            /**
             * @description Payment method used for this order.
             *     Examples: `ideal`, `creditcard`, `bancontact`, `paypal`
             * @example ideal
             */
            paymentMethod?: string | null;
            /**
             * Format: date-time
             * @description When this order was created (ISO 8601 format)
             * @example 2024-01-15T10:30:00Z
             */
            createdAt: string;
            /**
             * @description Current status of the order:
             *     - `created` - Order has just been created
             *     - `pending` - Payment is being processed
             *     - `paid` - Payment successful
             *     - `canceled` - Order has been canceled
             *     - `expired` - Order has expired
             * @example paid
             * @enum {string}
             */
            status: "created" | "pending" | "paid" | "canceled" | "expired";
            /**
             * @description Why the order was canceled. Null unless the status is `canceled`, and null
             *     for orders canceled before this field existed.
             *     - `payment_failure` - Payment recovery for this unpaid order was exhausted
             * @example null
             * @enum {string|null}
             */
            cancellationReason: "payment_failure" | null;
            /**
             * @description Invoice number for this order (assigned after payment)
             * @example INV-2024-0001
             */
            invoiceNumber?: string | null;
            /** @description Total amount including taxes */
            total: components["schemas"]["Money"];
            /** @description Subtotal amount before taxes */
            subtotal: components["schemas"]["Money"];
            /** @description Amount of the captured payment returned to the customer, before taxes, via refund or chargeback (settled) */
            reversedSubtotal: components["schemas"]["Money"];
            /** @description Remaining amount that can still be refunded, before taxes. */
            refundableSubtotal: components["schemas"]["Money"];
            /** @description Tax breakdown by rate */
            taxSummary: components["schemas"]["TaxSummaryItem"][];
            /** @description Line items in this order */
            lines: components["schemas"]["OrderLine"][];
            /** @description Customer billing details (buyer) */
            customerDetails: components["schemas"]["BillingDetails"];
            /** @description HATEOAS links to related resources */
            links: {
                /** @description Link to this order resource */
                self: components["schemas"]["Link"];
                /** @description Link to the customer who made this purchase. Null for orders with no associated customer. */
                customer: components["schemas"]["Link"] | null;
                /**
                 * @description Link to the customer-facing invoice page in the customer portal (text/html).
                 *     On a refund or chargeback order this page is the credit note. The link is signed
                 *     and expires after 72 hours; an expired link lets the customer request a fresh one by email.
                 */
                customerInvoice: components["schemas"]["Link"];
            };
        };
        /**
         * @description A line item in an order. `productType`/`productId` retain their existing meaning:
         *     initial subscription lines reference the plan; renewal and immediate-update
         *     lines reference the existing subscription. `relatedResources` adds the exact
         *     per-line subscription relationship without repeating the product reference.
         *     Discounts remain components of their owning line.
         *     Follow a paid Checkout's `orderId` to its order lines; Checkout is unchanged.
         *     No historical backfill is performed.
         */
        OrderLine: {
            /**
             * @description Unique identifier for this line item
             * @example order_item_Jk4pQrSvWm8NjLhYbUcP
             */
            id: string;
            /**
             * @description Resource type identifier
             * @example orderline
             * @constant
             */
            resource: "orderline";
            /**
             * @description Description of the item
             * @example Pro Monthly Subscription
             */
            description: string;
            /**
             * @description Number of units
             * @example 1
             */
            quantity: number;
            /** @description Price per unit before taxes */
            basePrice: components["schemas"]["Money"];
            /** @description Total price including taxes (basePrice * quantity + taxes) */
            total: components["schemas"]["Money"];
            /** @description Subtotal before taxes (basePrice * quantity) */
            subtotal: components["schemas"]["Money"];
            /** @description Tax breakdown by rate for this line */
            taxes: components["schemas"]["TaxSummaryItem"][];
            /**
             * @description Linked resource type. Initial subscription orders use
             *     `subscription_plan`; renewals and immediate updates use `subscription`.
             *     Existing values and new-write behavior are unchanged.
             * @example subscription_plan
             * @enum {string|null}
             */
            productType?: "one_off_product" | "subscription_plan" | "subscription" | "billing_details_verification" | "auth_request_product" | null;
            /**
             * @description Linked resource ID: a plan ID when productType is subscription_plan,
             *     a subscription ID when productType is subscription. Existing values and
             *     new-write behavior are unchanged.
             * @example subscription_plan_Hn5xWqVfKm8RjTgYbUcP
             */
            productId?: string | null;
            /**
             * @description Additional per-line relationships. Null on historical lines without recorded
             *     correlation and on unrelated lines (including one-off, billing-verification
             *     and authorization-minimum lines). Older payloads may omit this property.
             *     Signup, renewal and immediate-update lines use the same subscriptionId:
             *     the subscription associated with this line, not a creation or entitlement
             *     signal. On ordinary sale lines productType distinguishes initial signup
             *     (subscription_plan) from renewal/update (subscription). It does not
             *     distinguish a renewal from an immediate update. Reversal lines copy the
             *     original relationship and product reference, not a new creation claim.
             */
            relatedResources?: {
                /**
                 * @description Subscription associated with this line. On initial signup lines,
                 *     null while the exact subscription projection is unavailable,
                 *     including pending or skipped creation; null does not distinguish
                 *     these cases and is not proof that creation failed or was skipped.
                 *     The deterministic per-line identity is retained durably, so GET
                 *     reveals the ID after projection recovery without recreating the
                 *     paid order. Frozen webhook deliveries retain their original snapshot;
                 *     GET and newly generated webhooks use the current availability.
                 *     Separate same-plan checkout lines have distinct subscription IDs;
                 *     quantity is the quantity of one subscription, not a subscription count.
                 *     Creation does not imply activation, entitlement or immediate readability.
                 *     Validate ownership and status before granting access.
                 */
                subscriptionId: string | null;
            } | null;
        };
        /** @description A signed URL for the customer to update invoice details (billing address, VAT number, company name) */
        InvoiceUpdateLink: {
            /**
             * Format: uri
             * @description Signed URL to the address update page.
             *     Valid for a limited time (typically 24 hours).
             * @example https://vatly.com/invoices/order_Hn5xWqVfKm8RjTgYbUcP/edit?signature=abc123...
             */
            href: string;
            /**
             * @description Content type of the linked page
             * @example text/html
             * @constant
             */
            type: "text/html";
        };
        /**
         * @description A refund represents a partial or full reversal of an order payment.
         *     Refunds are processed through the original payment provider.
         */
        Refund: {
            /**
             * @description Unique identifier for the refund
             * @example refund_Xk9pQrSvWm4NjLhYbUcP
             */
            id: string;
            /**
             * @description Resource type identifier (enum property replaced by openapi-typescript)
             * @enum {string}
             */
            resource: "refund";
            /**
             * @description ID of the credit note order created for this refund. Always present in
             *     the payload; `null` until the refund is processed, then set to the
             *     credit-note order id.
             * @example order_Vr8kQdFhSrG4Y3DnfsdqH
             */
            orderId: string | null;
            /**
             * @description ID of the customer receiving the refund
             * @example customer_Lp3mNvBxKw7RjTgYcZaE
             */
            customerId: string;
            /**
             * @description Whether this refund is in test mode
             * @example false
             */
            testmode: boolean;
            /**
             * Format: date-time
             * @description When this refund was created (ISO 8601 format)
             * @example 2024-01-15T10:30:00Z
             */
            createdAt: string;
            /**
             * @description Current status of the refund:
             *     - `pending` - Refund is ready to be sent to the bank
             *     - `queued` - Refund is queued due to a lack of balance
             *     - `processing` - Refund is being processed (cancellation no longer possible)
             *     - `refunded` - Refund has been processed successfully
             *     - `failed` - Refund has failed after processing
             *     - `canceled` - Refund was canceled
             * @example refunded
             * @enum {string}
             */
            status: "pending" | "queued" | "processing" | "refunded" | "failed" | "canceled";
            /**
             * @description ID of the original order being refunded
             * @example order_Fp2kQrSvWm8NjLhYbUcP
             */
            originalOrderId: string;
            /** @description Total refund amount including taxes */
            total: components["schemas"]["Money"];
            /** @description Refund subtotal before taxes */
            subtotal: components["schemas"]["Money"];
            /** @description Tax breakdown by rate being refunded */
            taxSummary: components["schemas"]["TaxSummaryItem"][];
            /** @description Refund line items */
            lines: components["schemas"]["RefundLine"][];
            /** @description HATEOAS links to related resources */
            links: {
                /** @description Link to this refund resource */
                self: components["schemas"]["Link"];
                /** @description Link to the original order */
                originalOrder: components["schemas"]["Link"];
                /** @description Link to the credit note order. Always present; `null` until the credit-note order is created. */
                order: components["schemas"]["Link"] | null;
                /**
                 * @description Link to this refund's credit note in the customer portal (text/html). This is the
                 *     same page as the credit-note order's `customerInvoice` link, not the original order's invoice.
                 *     Always present; `null` until the refund is processed. The link is signed and
                 *     expires after 72 hours; an expired link lets the customer request a fresh one by email.
                 */
                customerInvoice: components["schemas"]["Link"] | null;
            };
        };
        /** @description A line item in a refund */
        RefundLine: {
            /**
             * @description Unique identifier for this refund line
             * @example refund_item_Tk7mNvBxKw2RjTgYcZaE
             */
            id: string;
            /**
             * @description Resource type identifier
             * @example refundline
             * @constant
             */
            resource: "refundline";
            /**
             * @description Description of the refunded item
             * @example Pro Monthly Subscription (Refund)
             */
            description: string;
            /**
             * @description Number of units being refunded
             * @example 1
             */
            quantity: number;
            /** @description Refund amount per unit before taxes */
            basePrice: components["schemas"]["Money"];
            /** @description Total refund amount including taxes */
            total: components["schemas"]["Money"];
            /** @description Refund subtotal before taxes */
            subtotal: components["schemas"]["Money"];
            /** @description Tax breakdown by rate being refunded */
            taxes: components["schemas"]["TaxSummaryItem"][];
        };
        /** @description Request body for creating a partial refund */
        CreateRefundRequest: {
            /**
             * @description Items to refund
             * @example [
             *       {
             *         "itemId": "order_item_Jk4pQrSvWm8NjLhYbUcP",
             *         "amount": {
             *           "value": "15.00",
             *           "currency": "EUR"
             *         },
             *         "description": "Partial refund"
             *       }
             *     ]
             */
            items: components["schemas"]["RefundItem"][];
            metadata?: components["schemas"]["Metadata"];
        };
        /** @description Request body for creating a full refund */
        CreateFullRefundRequest: {
            metadata?: components["schemas"]["Metadata"];
        };
        /**
         * @description A chargeback represents a payment dispute initiated by a customer through their bank or card issuer.
         *     Chargebacks are created automatically when the payment provider notifies Vatly of a dispute.
         */
        Chargeback: {
            /**
             * @description Unique identifier for the chargeback
             * @example chargeback_Mn6xBtPvKw2RjTgYcZaE
             */
            id: string;
            /**
             * @description Resource type identifier (enum property replaced by openapi-typescript)
             * @enum {string}
             */
            resource: "chargeback";
            /**
             * @description ID of the customer the chargeback was raised against
             * @example customer_Lp3mNvBxKw7RjTgYcZaE
             */
            customerId: string;
            /**
             * @description Whether this chargeback is in test mode
             * @example false
             */
            testmode: boolean;
            /**
             * Format: date-time
             * @description When this chargeback was created (ISO 8601 format)
             * @example 2024-01-15T10:30:00Z
             */
            createdAt: string;
            /**
             * @description Current status of the chargeback dispute:
             *     - `pending` - Dispute received, awaiting action
             *     - `requires_amount_review` - Provider amount exceeds the original order; financial completion is quarantined pending review
             *     - `accepted` - Merchant accepted the dispute
             *     - `rejected` - Dispute rejected
             *     - `evidence_submitted` - Evidence submitted, awaiting decision
             *     - `won` - Dispute resolved in the merchant's favor
             *     - `lost` - Dispute resolved in the customer's favor
             * @example pending
             * @enum {string}
             */
            status: "pending" | "requires_amount_review" | "accepted" | "rejected" | "evidence_submitted" | "won" | "lost";
            /** @description Amount of the chargeback */
            amount: components["schemas"]["Money"];
            /**
             * @description Amount that was deducted from the merchant's settlement.
             *     May differ from `amount` due to currency conversion or fees.
             */
            settlementAmount: components["schemas"]["Money"];
            /** @description Total chargeback amount including taxes */
            total: components["schemas"]["Money"];
            /** @description Chargeback subtotal before taxes */
            subtotal: components["schemas"]["Money"];
            /** @description Tax breakdown by rate for the chargeback */
            taxSummary: components["schemas"]["TaxSummaryItem"][];
            /**
             * @description Reason code or description for the chargeback.
             *     Common reasons include:
             *     - `fraud` - Unauthorized transaction
             *     - `product_not_received` - Customer claims non-delivery
             *     - `product_unacceptable` - Customer claims product was defective
             *     - `duplicate` - Customer claims duplicate charge
             *     - `subscription_canceled` - Customer claims subscription was canceled
             * @example fraud
             */
            reason: string;
            /**
             * @description ID of the original order that was charged back
             * @example order_Fp2kQrSvWm8NjLhYbUcP
             */
            originalOrderId: string;
            /**
             * @description ID of the credit note order created for this chargeback. Always present
             *     in the payload; `null` until the chargeback is processed, then set to the
             *     credit-note order id.
             * @example order_Rk5pQrSvWm8NjLhYbUcP
             */
            orderId: string | null;
            /** @description HATEOAS links to related resources */
            links: {
                /** @description Link to this chargeback resource */
                self: components["schemas"]["Link"];
                /** @description Link to the original order */
                originalOrder: components["schemas"]["Link"];
                /** @description Link to the credit note order. Always present; `null` until the credit-note order is created. */
                order: components["schemas"]["Link"] | null;
                /**
                 * @description Link to this chargeback's credit note in the customer portal (text/html). This is the
                 *     same page as the credit-note order's `customerInvoice` link, not the original order's invoice.
                 *     Always present; `null` until the lost chargeback is processed. The link is signed and
                 *     expires after 72 hours; an expired link lets the customer request a fresh one by email.
                 */
                customerInvoice: components["schemas"]["Link"] | null;
            };
        };
        /**
         * @description A persisted webhook event — the record returned by `GET /webhook-events/{eventId}`.
         *     It captures a domain event that was delivered to your endpoint, including the full
         *     resource payload at the time the event occurred.
         *
         *     This is the *stored* resource. For the shape Vatly POSTs to your endpoint on each
         *     live delivery (which additionally includes the `webhook.setup` verification call),
         *     see `WebhookDelivery`.
         */
        WebhookEvent: {
            /**
             * @description Unique identifier for the webhook event
             * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
             */
            id: string;
            /**
             * @description Resource type identifier
             * @example webhook_event
             * @constant
             */
            resource: "webhook_event";
            /**
             * @description Name of the event that triggered this webhook:
             *     - `order.paid` - Order payment was successful
             *     - `order.canceled` - Order was canceled
             *     - `order.chargeback_received` - Chargeback was received for an order
             *     - `order.chargeback_reversed` - Chargeback was reversed
             *     - `order.payment_failed` - A payment failed and the order entered payment recovery (dunning); sent once per failed order
             *     - `refund.completed` - Refund was processed successfully
             *     - `refund.failed` - Refund processing failed
             *     - `refund.canceled` - Refund was canceled
             *     - `subscription.started` - Subscription was started
             *     - `subscription.canceled_immediately` - Subscription was canceled immediately
             *     - `subscription.canceled_for_nonpayment` - Subscription was canceled because payment recovery was exhausted
             *     - `subscription.canceled_with_grace_period` - Subscription was canceled with a grace period
             *     - `subscription.cancellation_grace_period_completed` - Subscription grace period ended
             *     - `subscription.resumed` - A canceled subscription was resumed during its grace period
             *     - `subscription.billing_updated` - A subscription's billing details changed; in practice today the mandate (payment method on file), e.g. to refresh the masked payment method identifier shown to the customer
             *     - `subscription.updated` - A subscription changed: on an immediate change, when a scheduled change takes effect at renewal, or when a renewal payment is confirmed; see `reason`
             *     - `subscription.update_scheduled` - A plan/price/quantity change was scheduled for the next billing cycle; the target values are in `object.scheduledUpdate`
             *     - `checkout.paid` - Checkout was paid successfully
             *     - `checkout.failed` - Checkout payment failed
             *     - `checkout.canceled` - Checkout was canceled
             *     - `checkout.expired` - Checkout session expired
             *
             *     `webhook.setup` is intentionally absent: the verification handshake is not
             *     persisted and so never appears on this resource (see `WebhookDelivery`).
             *
             *     This list is kept in sync with the webhook transformer registry by
             *     `php artisan openapi:audit-webhook-drift`.
             * @example order.paid
             * @enum {string}
             */
            eventName: "order.paid" | "order.canceled" | "order.chargeback_received" | "order.chargeback_reversed" | "order.payment_failed" | "refund.completed" | "refund.failed" | "refund.canceled" | "subscription.started" | "subscription.canceled_immediately" | "subscription.canceled_for_nonpayment" | "subscription.canceled_with_grace_period" | "subscription.cancellation_grace_period_completed" | "subscription.resumed" | "subscription.billing_updated" | "subscription.updated" | "subscription.update_scheduled" | "checkout.paid" | "checkout.failed" | "checkout.canceled" | "checkout.expired" | "one_off_product.update_submitted" | "one_off_product.update_approved" | "one_off_product.update_rejected" | "one_off_product.archived" | "one_off_product.unarchived" | "subscription_plan.update_submitted" | "subscription_plan.update_approved" | "subscription_plan.update_rejected" | "subscription_plan.archived" | "subscription_plan.unarchived";
            /**
             * @description Why the event fired, for events that have more than one cause. Always
             *     present; `null` for every event other than `subscription.updated`.
             *
             *     For `subscription.updated`:
             *     - `updated_immediately` - A plan, price, interval or quantity change took effect immediately
             *     - `updated_on_renewal` - A scheduled plan, price, interval or quantity change took effect at a renewal
             *     - `renewed` - A renewal payment was confirmed; `renewedAt` and `renewedUntil` moved
             *
             *     New values may be added; treat an unknown value as a generic change.
             * @example renewed
             */
            reason: string | null;
            /**
             * @description Type of the resource this event relates to
             * @example order
             */
            entityType: string;
            /**
             * @description ID of the resource this event relates to
             * @example order_Hn5xWqVfKm8RjTgYbUcP
             */
            entityId: string;
            /**
             * @description The full resource payload at the time of the event, serialized identically
             *     to the corresponding REST resource. The concrete shape is selected by the
             *     payload's own `resource` field (the discriminator):
             *       - `order.paid`, `order.canceled`, `order.payment_failed` → Order
             *       - `order.chargeback_received`, `order.chargeback_reversed` → Chargeback
             *       - `refund.*` → Refund
             *       - `subscription.*` → Subscription
             *       - `checkout.*` → Checkout
             *       - `one_off_product.*` → OneOffProduct
             *       - `subscription_plan.*` → SubscriptionPlan
             *
             *     Note `object.resource` may differ from `entityType`: chargeback events carry
             *     `entityType: order` (the order the chargeback belongs to) but a Chargeback object.
             */
            object: components["schemas"]["Order"] | components["schemas"]["Chargeback"] | components["schemas"]["Refund"] | components["schemas"]["Subscription"] | components["schemas"]["Checkout"] | components["schemas"]["OneOffProduct"] | components["schemas"]["SubscriptionPlan"];
            /**
             * Format: date-time
             * @description ISO 8601 timestamp of when the webhook event was created.
             * @example 2026-05-21T14:32:08+00:00
             */
            createdAt: string;
            /**
             * @description Whether the event originated from a test-mode resource.
             *     `true` for events created with a `test_` prefixed token, `false` for live events.
             * @example false
             */
            testmode: boolean;
            /** @description HATEOAS links to related resources. Always present on the persisted event. */
            links: {
                /** @description Link to this webhook event resource */
                self: components["schemas"]["Link"];
            };
        };
        /**
         * @description A registered webhook endpoint. Vatly POSTs event deliveries to its `url`
         *     and signs each one with the secret you set (see the `Vatly-Signature`
         *     header).
         *
         *     A storefront can have up to five endpoints in each mode. URLs must be
         *     unique within the storefront and mode. Each endpoint receives only the
         *     public event names in `enabledEvents`; an empty list makes it dormant.
         *
         *     The signing secret is write-only: you provide it on creation (and may rotate
         *     it via update) but it is never returned in any response. Store the value you
         *     send; the API will not give it back.
         */
        WebhookEndpoint: {
            /**
             * @description Unique identifier for the webhook endpoint
             * @example webhook_QdEpFhdSrG4Y3DnfsdqsH
             */
            id: string;
            /**
             * @description Resource type identifier
             * @example webhook_endpoint
             * @constant
             */
            resource: "webhook_endpoint";
            /**
             * @description Whether this endpoint receives test-mode events
             * @example false
             */
            testmode: boolean;
            /**
             * Format: uri
             * @description The HTTPS URL deliveries are POSTed to
             * @example https://merchant.example/webhooks/vatly
             */
            url: string;
            /**
             * @description The endpoint's persisted subscription names. Current names in this list
             *     are delivered; a retired public name can remain visible for stable
             *     readback but is inert. New event names are not added automatically;
             *     update this list to opt in. An empty list means no domain events are
             *     delivered, although `webhook.setup` is still sent whenever Vatly
             *     verifies the endpoint configuration.
             * @example [
             *       "order.paid",
             *       "refund.completed"
             *     ]
             */
            enabledEvents: string[];
            /**
             * Format: date-time
             * @description When this endpoint was created (ISO 8601 format)
             * @example 2024-01-15T10:30:00Z
             */
            createdAt: string;
            /** @description HATEOAS links to related resources */
            links: {
                /** @description Link to this webhook endpoint resource */
                self: components["schemas"]["Link"];
            };
        };
        /** @description Request body for registering a new webhook endpoint */
        CreateWebhookEndpointRequest: {
            /**
             * Format: uri
             * @description The HTTPS URL deliveries are POSTed to. Must be publicly reachable and
             *     present a valid SSL certificate — Vatly sends a `webhook.setup`
             *     verification ping on registration and rejects the request if it fails.
             *     `localhost` and loopback addresses are not allowed.
             * @example https://merchant.example/webhooks/vatly
             */
            url: string;
            /**
             * @description Signing secret for this endpoint, used to compute the `Vatly-Signature`
             *     HMAC on every delivery. You choose it (e.g. pinned from an environment
             *     variable) and use it to verify inbound webhooks. It is write-only — keep
             *     this value, as the API never returns it.
             * @example whsec_3f9a1c7e2d4f7b9c5a2c1d5b7e9f3a8d
             */
            secret: string;
            /**
             * @description The explicit events delivered to this endpoint. If omitted, Vatly
             *     stores all event names available at registration time. New event names
             *     added later are not enabled automatically. Send an empty list to create
             *     a dormant endpoint. `webhook.setup` cannot be selected and remains an
             *     unconditional configuration-verification event.
             * @example [
             *       "order.paid",
             *       "refund.completed"
             *     ]
             */
            enabledEvents?: components["schemas"]["WebhookSubscriptionEventName"][];
        };
        /**
         * @description Request body for updating a webhook endpoint. Send `url` to repoint the
         *     endpoint, `secret` to rotate the signing secret, and/or `enabledEvents` to
         *     replace its full subscription set. Omitting all three is a no-op that
         *     returns the current endpoint.
         */
        UpdateWebhookEndpointRequest: {
            /**
             * Format: uri
             * @description New HTTPS delivery URL. Revalidated for reachability and SSL the same
             *     way as on creation.
             * @example https://merchant.example/webhooks/vatly-v2
             */
            url?: string;
            /**
             * @description New signing secret for this endpoint. Write-only — keep the value, as
             *     the API never returns it.
             * @example whsec_a1b2c3d4e5f60718293a4b5c6d7e8f90
             */
            secret?: string;
            /**
             * @description Replaces the endpoint's complete event subscription set. Omit this
             *     field to preserve the current subscriptions; send an empty list to make
             *     the endpoint dormant. New event names are never added automatically.
             *     `webhook.setup` is not subscribable.
             * @example [
             *       "checkout.paid",
             *       "order.paid"
             *     ]
             */
            enabledEvents?: components["schemas"]["WebhookSubscriptionEventName"][];
        };
        /**
         * @description A subscription represents a recurring billing relationship with a customer.
         *     Subscriptions automatically renew according to their billing interval.
         */
        Subscription: {
            /**
             * @description Unique identifier for the subscription
             * @example subscription_Lp3mNvBxKw7RjTgYcZaE
             */
            id: string;
            /**
             * @description Resource type identifier (enum property replaced by openapi-typescript)
             * @enum {string}
             */
            resource: "subscription";
            /**
             * @description ID of the customer who owns this subscription
             * @example customer_Lp3mNvBxKw7RjTgYcZaE
             */
            customerId: string;
            /**
             * @description ID of the subscription plan this subscription is based on
             * @example subscription_plan_Wt5mNvBxKw7YcZaEjLhR
             */
            subscriptionPlanId: string;
            /**
             * @description Whether this subscription is in test mode
             * @example false
             */
            testmode: boolean;
            /**
             * @description Name of the subscription (from the plan)
             * @example Pro Monthly
             */
            name: string;
            /**
             * @description Description of the subscription
             * @example Full access to all Pro features
             */
            description: string;
            /** @description Customer's billing address for this subscription */
            billingAddress: components["schemas"]["BillingAddress"];
            /** @description Price per billing cycle before taxes */
            basePrice: components["schemas"]["Money"];
            /**
             * @description Number of subscription units (e.g., seats)
             * @example 1
             */
            quantity: number;
            /**
             * @description Billing interval unit
             * @example month
             * @enum {string}
             */
            interval: "day" | "week" | "month" | "year";
            /**
             * @description Number of interval units between billing cycles
             * @example 1
             */
            intervalCount: number;
            /**
             * @description Current status of the subscription:
             *     - `active` - Subscription is active and will renew
             *     - `created` - Subscription has been created but not yet started
             *     - `trial` - Subscription is in trial period
             *     - `on_grace_period` - Subscription is canceled but still active until period ends
             *     - `paused` - Subscription is temporarily paused
             *     - `canceled` - Subscription has been canceled
             * @example active
             * @enum {string}
             */
            status: "active" | "created" | "trial" | "on_grace_period" | "paused" | "canceled";
            /**
             * @description Why the subscription was canceled. Null unless a cancellation has been
             *     requested. Public values are intentionally decoupled from internal domain
             *     reason names:
             *     - `payment_failure` - Payment recovery was exhausted after failed renewals
             *     - `merchant_request` - The merchant explicitly canceled the subscription
             *     - `customer_request` - The customer canceled from the self-service portal
             * @example null
             * @enum {string|null}
             */
            cancellationReason: "payment_failure" | "merchant_request" | "customer_request" | null;
            /**
             * @description Payment method on file for this subscription, as an inline summary
             *     intended for billing-portal rendering ("Visa ending in 4242"). May
             *     be `null` when the subscription has no mandate yet (e.g. ended /
             *     canceled-before-payment states).
             */
            mandate: components["schemas"]["Mandate"] | null;
            /**
             * Format: date-time
             * @description When the subscription started (ISO 8601 format)
             * @example 2024-01-15T10:30:00Z
             */
            startedAt: string | null;
            /**
             * Format: date-time
             * @description When the subscription ended (ISO 8601 format)
             */
            endedAt: string | null;
            /**
             * Format: date-time
             * @description When the subscription was canceled (ISO 8601 format)
             */
            canceledAt: string | null;
            /**
             * Format: date-time
             * @description When the subscription was last renewed (ISO 8601 format)
             * @example 2024-02-15T10:30:00Z
             */
            renewedAt: string | null;
            /**
             * Format: date-time
             * @description Current billing period end date (ISO 8601 format)
             * @example 2024-03-15T10:30:00Z
             */
            renewedUntil: string | null;
            /**
             * Format: date-time
             * @description When the next renewal will be attempted (ISO 8601 format).
             *     Null if subscription is canceled or ended.
             * @example 2024-03-15T10:30:00Z
             */
            nextRenewalAt: string | null;
            /**
             * Format: date-time
             * @description When the trial period ends (ISO 8601 format).
             *     Null if not in trial or trial has ended.
             */
            trialUntil: string | null;
            /** @description HATEOAS links to related resources */
            links: {
                /** @description Link to this subscription resource */
                self: components["schemas"]["Link"];
                /** @description Link to the customer who owns this subscription */
                customer: components["schemas"]["Link"];
            };
            /**
             * @description The target values for a change scheduled to take effect at the subscription's next
             *     billing cycle — set by `PATCH /subscriptions/{subscriptionId}` with
             *     `applyImmediately: false`. The rest of the object is the subscription's *current*
             *     state; `scheduledUpdate` is what it will become.
             *
             *     Null when nothing is pending. Always present on both the REST resource and webhook
             *     deliveries, so this is the authoritative way to reconcile a pending change — do not
             *     depend on having received the `subscription.update_scheduled` webhook, which is
             *     delivered once.
             *
             *     Cleared when the change is applied at renewal, and when it is discarded because the
             *     subscription was canceled before that renewal happened.
             */
            scheduledUpdate: {
                /**
                 * @description ID of the plan the subscription will switch to
                 * @example subscription_plan_Wt5mNvBxKw7YcZaEjLhR
                 */
                subscriptionPlanId: string;
                /**
                 * @description Name of the scheduled plan
                 * @example Pro Annual
                 */
                name: string;
                /** @description Description of the scheduled plan */
                description: string;
                /** @description Scheduled price per billing cycle before taxes */
                basePrice: components["schemas"]["Money"];
                /**
                 * @description Scheduled quantity
                 * @example 1
                 */
                quantity: number;
                /**
                 * @description Scheduled billing interval unit
                 * @example month
                 * @enum {string}
                 */
                interval: "day" | "week" | "month" | "year";
                /**
                 * @description Scheduled number of interval units between billing cycles
                 * @example 1
                 */
                intervalCount: number;
                /**
                 * Format: date-time
                 * @description When the change takes effect — the subscription's next renewal date. Null if the
                 *     subscription has no scheduled renewal.
                 * @example 2024-03-15T10:30:00Z
                 */
                effectiveAt: string | null;
            } | null;
        };
        /**
         * @description Request body for updating a subscription.
         *     At least one of `subscriptionPlanId`, `quantity`, or `price` must be provided.
         */
        UpdateSubscriptionRequest: {
            /**
             * @description ID of the new subscription plan.
             *     Must match the testmode of the current subscription.
             * @example subscription_plan_Wt5mNvBxKw7YcZaEjLhR
             */
            subscriptionPlanId?: string;
            /**
             * @description The new total quantity (e.g. number of seats). This sets the
             *     quantity to the given value — it is not added to the current
             *     quantity. Omit it to leave the quantity unchanged.
             * @example 5
             */
            quantity?: number;
            /**
             * @description Change the recurring price, keeping the current plan. Provide
             *     `price` without a `subscriptionPlanId` to change the price in place;
             *     combine it with `subscriptionPlanId` to switch plans at a custom
             *     price. The currency must match the subscription's currency. The
             *     `prorate`, `applyImmediately`, `invoiceImmediately` and anchor
             *     options apply exactly as they do for a plan or quantity change.
             */
            price?: {
                /**
                 * @description Price amount as a decimal string, with the exact number of decimals for the currency.
                 * @example 99.99
                 */
                value: string;
                /**
                 * @description Must match the subscription's own currency (a subscription's
                 *     currency is fixed at checkout and cannot be changed via an update).
                 * @example EUR
                 * @enum {string}
                 */
                currency: "EUR" | "USD";
            };
            /**
             * @description How an immediate change is priced.
             *     - `true`: the new price for the time left on the cycle, minus a credit
             *       for the old price over that same time
             *     - `false`: the full new price for the current cycle, on top of what was
             *       already paid. This does not skip the charge; use
             *       `prorationCharge: false` for that
             *
             *     Ignored when `prorationCharge` is `false`.
             * @default true
             * @example true
             */
            prorate?: boolean;
            /**
             * @description Whether an immediate change is charged at all.
             *     - `true`: charged as set by `prorate` and `invoiceImmediately`
             *     - `false`: the change applies now and nothing is charged for it. The
             *       next renewal bills the new price, unless a change is already
             *       scheduled for that renewal: that change still applies. A downgrade
             *       gets no credit. During a trial the trial keeps running and its end
             *       bills the new plan
             *
             *     With `false`, `invoiceImmediately: true`, `anchor`, `resetAnchor`,
             *     `trialUntil` and a change to a plan with a different interval are
             *     rejected with `422`: each would start or bill a new cycle now.
             * @default true
             * @example false
             */
            prorationCharge?: boolean;
            /**
             * @description Whether to apply changes immediately or at the end of the current billing period.
             *     - `true`: Changes take effect immediately (with proration if enabled)
             *     - `false`: Changes apply when the current period ends
             *
             *     During a trial, `true` ends the trial and starts the first paid cycle,
             *     charged right away. Without `anchor` the cycle starts that day at the
             *     full new price; with `anchor` it runs to that date, priced per
             *     `prorate`. A subscription that is `on_grace_period` starts no paid
             *     cycle and still ends on its communicated date.
             * @default false
             * @example true
             */
            applyImmediately?: boolean;
            /**
             * @description Whether to generate and charge an invoice immediately for proration.
             *     Only applies when `applyImmediately` and `prorate` are both true.
             *
             *     When `false` (the default) the proration delta is parked on the current
             *     cycle and billed as a line on the next renewal invoice — the customer
             *     gets one invoice and one payment covering both. If the subscription is
             *     cancelled before that renewal there is no next invoice and the parked
             *     amount is waived, so a customer is never charged at the moment they
             *     cancel.
             *
             *     **Set this to `true` on yearly and other long-interval plans.** The
             *     default suits monthly billing, where the delta is collected within
             *     weeks. On a yearly plan an upgrade in month 2 is not billed until
             *     month 12, and is waived entirely if the customer cancels at any point
             *     in between — so the longer the interval, the more the deferral costs
             *     you. Charging immediately trades that for a separate invoice and
             *     payment (and its transaction fee) per change.
             *
             *     An immediate update during a trial is always charged right away,
             *     whatever this is set to, because it starts the first paid cycle. This
             *     does not apply to a subscription that is `on_grace_period`.
             * @default false
             * @example false
             */
            invoiceImmediately?: boolean;
            /**
             * Format: date
             * @description Set the billing anchor to a specific calendar date (YYYY-MM-DD,
             *     interpreted in UTC). The new billing cycle is recalculated around
             *     this anchor. Date-only by design — the anchor identifies a day,
             *     not an instant, so daylight-saving transitions don't shift it.
             *     Cannot be combined with `resetAnchor`.
             * @example 2024-02-01
             */
            anchor?: string | null;
            /**
             * @description Reset the billing anchor to "now" — the moment the update
             *     is processed becomes the new cycle anchor, and future
             *     renewals align to it. Useful when a customer upgrades
             *     mid-cycle and you want the new plan's billing period to
             *     start fresh from today.
             *     Cannot be combined with `anchor`.
             * @default false
             * @example true
             */
            resetAnchor?: boolean;
            /**
             * Format: date-time
             * @description Extend or set a trial period until this date (ISO 8601 format).
             *     Cannot be combined with `anchor`.
             * @example 2024-02-15T00:00:00Z
             */
            trialUntil?: string | null;
        };
        /** @description Request body for updating subscription billing details via hosted flow */
        UpdateSubscriptionBillingRequest: {
            /**
             * Format: uri
             * @description URL to redirect after successful billing update
             * @example https://example.com/billing-updated
             */
            redirectUrlSuccess: string;
            /**
             * Format: uri
             * @description URL to redirect if customer cancels the update
             * @example https://example.com/billing-canceled
             */
            redirectUrlCanceled: string;
            /**
             * @description Optional editable prefill for the hosted billing update form. When
             *     supplied, it replaces the subscription's stored billing details as the
             *     prefill, so send every field you want shown; empty strings give a blank
             *     form. Omit it, or send `null` or `{}`, to prefill the stored details.
             *     `country` must be an ISO 3166-1 alpha-2 code. A supplied `taxId` is
             *     only a prefill; it is not registered until the customer submits the
             *     form.
             */
            billingAddress?: components["schemas"]["BillingAddress"] | null;
        };
        /**
         * @description A mandate represents an authorization to charge a customer's payment method
         *     on a recurring basis (cards, SEPA Direct Debit, PayPal, Bacs).
         *
         *     This shape is the inline summary exposed on subscriptions — enough to
         *     render "Visa ending in 4242" in a billing portal without an extra round
         *     trip. A dedicated `/v1/mandates/{id}` endpoint with richer detail (status,
         *     validity timestamps, billing snapshot) is on the roadmap; fields here are
         *     forward-compatible additions to that future schema.
         */
        Mandate: {
            /**
             * @description Normalized payment method category, provider-agnostic:
             *     - `card` — credit/debit card (incl. Apple Pay, Google Pay wallets)
             *     - `sepa_debit` — SEPA Direct Debit (incl. iDEAL, Bancontact, KBC and
             *       other rail aliases that settle into a directdebit mandate)
             *     - `paypal` — PayPal billing agreement
             *     - `bacs_debit` — UK Bacs Direct Debit
             * @example card
             * @enum {string}
             */
            method: "card" | "sepa_debit" | "paypal" | "bacs_debit";
            /**
             * @description Customer-facing masked identifier for the payment method on file:
             *     the last 4 of a card (`"4242"`), a masked IBAN (`"NL91****4300"`),
             *     a masked PayPal email (`"j***@example.com"`), or last 4 of a Bacs
             *     account (`"****5678"`).
             *
             *     May briefly be `null` for freshly-subscribed customers when the
             *     underlying authorization event doesn't carry the masked identifier
             *     inline — in that case it lands on a follow-up sync (runs at most
             *     every 5 minutes) and the field updates from `null` to the resolved
             *     value once the sync completes.
             * @example 4242
             */
            maskedIdentifier: string | null;
        };
        /**
         * @description Request body for updating a customer's identity fields. Only `name` and
         *     `email` may be changed here — both are optional (send either or both).
         *
         *     Billing-address fields (company name, tax ID, street, city, country, etc.)
         *     are not supported by this endpoint and are ignored; amend those through the
         *     hosted billing-update flow, which validates tax-relevant data centrally.
         */
        UpdateCustomerRequest: {
            /**
             * @description Customer's display / account-holder name.
             * @example John Doe
             */
            name?: string | null;
            /**
             * Format: email
             * @description Customer's email address, canonicalized on the way in exactly as on
             *     create (lower-cased local part, Punycode domain per UTS #46).
             *
             *     Unlike create, a collision is rejected here: moving this customer onto
             *     an address another customer in the same storefront and testmode holds
             *     returns `422`. Creating with a known address is a recovery; moving one
             *     customer onto another's address is a conflict.
             * @example new.email@example.com
             */
            email?: string;
        };
        /**
         * @description Optional settings for a short-lived hosted customer portal session. The body
         *     may be omitted or sent as `{}`. `returnUrl` must be sent here in the JSON
         *     body; query-string input is rejected.
         */
        CreatePortalSessionRequest: {
            /**
             * Format: uri
             * @description Absolute HTTPS URL without embedded credentials, rendered as a return
             *     link in the hosted portal. The runtime limit is 2,048 UTF-8 bytes.
             *     Vatly never fetches or automatically redirects to this URL.
             * @example https://merchant.example/account/billing
             */
            returnUrl?: string | null;
        };
        /**
         * @description A short-lived, single-use entry link to the hosted customer portal. Redirect
         *     the customer's browser to `url`; do not store it as a long-lived account
         *     link.
         */
        PortalSession: {
            /**
             * Format: uri
             * @description Single-use HTTPS URL to redirect the customer to.
             * @example https://billing.vatly.com/authenticate?credential=...
             */
            url: string;
            /**
             * Format: date-time
             * @description Expiry of the one-time entry link, not of the resulting browser session.
             * @example 2026-09-01T12:15:00Z
             */
            expiresAt: string;
            /**
             * Format: uri
             * @description The validated absolute HTTPS return URL supplied in the request, or
             *     null. It contains no embedded credentials and is limited to 2,048
             *     UTF-8 bytes.
             * @example https://merchant.example/account/billing
             */
            returnUrl: string | null;
        };
        /**
         * @description Request body for submitting an update to a live one-off product. Each request
         *     is the **complete set of changes** relative to the current live product, and
         *     must contain at least one field. A field submitted equal to the live value is
         *     ignored; a submission that nets to no change clears any pending update. The
         *     update enters review (`updateStatus: pending`) before it takes effect (in test
         *     mode it is approved automatically).
         */
        UpdateOneOffProductRequest: {
            /**
             * @description New display name of the product.
             * @example Premium License v2
             */
            name?: string;
            /**
             * @description New description of the product.
             * @example Now with more premium
             */
            description?: string;
            /** @description New price of the product, in EUR. */
            basePrice?: components["schemas"]["EurMoney"];
            /**
             * @description What kind of product this is:
             *     - `saas` — software supplied as a service (hosted, licensed or otherwise
             *       delivered online)
             *     - `ebook` — an electronic publication supplied as a download or stream
             *
             *     Set when the product is created. Subscription plans accept `saas` only;
             *     an e-book is a one-time purchase, so sell it as a one-off product.
             * @example saas
             * @enum {string}
             */
            productType?: "saas" | "ebook";
        };
        /**
         * @description Request body for submitting an update to a live subscription plan. Each
         *     request is the **complete set of changes** relative to the current live plan,
         *     and must contain at least one field. A field submitted equal to the live value
         *     is ignored; a submission that nets to no change clears any pending update. The
         *     update enters review (`updateStatus: pending`) before it takes effect (in test
         *     mode it is approved automatically).
         *
         *     The interval cannot be changed once the plan has ever been used by a
         *     subscription, active or not. The price stays changeable.
         */
        UpdateSubscriptionPlanRequest: {
            /**
             * @description New display name of the plan.
             * @example Pro Weekly
             */
            name?: string;
            /**
             * @description New description of the plan.
             * @example Billed weekly
             */
            description?: string;
            /** @description New price per billing interval, in EUR. */
            basePrice?: components["schemas"]["EurMoney"];
            /**
             * @example saas
             * @enum {string}
             */
            productType?: "saas";
            /**
             * @example week
             * @enum {string}
             */
            interval?: "day" | "week" | "month" | "year";
            /**
             * @description Required when `interval` is provided.
             * @example 1
             */
            intervalCount?: number;
        };
        /** @description Simplified tax rate information */
        TaxSummaryRate: {
            /**
             * @description Human-readable name of the tax rate
             * @example VAT
             */
            name: string;
            /**
             * @description Tax rate percentage
             * @example 21
             */
            percentage: number;
            /**
             * @description Percentage of the amount that is taxable
             * @example 100
             */
            taxablePercentage: number;
        };
        /** @description A single tax rate entry with its calculated amount */
        TaxSummaryItem: {
            taxRate: components["schemas"]["TaxSummaryRate"];
            /** @description Tax amount for this rate */
            amount: components["schemas"]["Money"];
        };
        /** @description An item to refund from an order */
        RefundItem: {
            /**
             * @description ID of the order line item to refund
             * @example order_item_Jk4pQrSvWm8NjLhYbUcP
             */
            itemId: string;
            /**
             * @description Amount to refund for this item (before taxes).
             *     Cannot exceed the remaining refundable amount for the item.
             */
            amount: components["schemas"]["Money"];
            /**
             * @description Custom description for this refund line
             * @example Partial refund for service issue
             */
            description?: string | null;
            /**
             * @description Additional description line for the refund
             * @example Ticket #12345
             */
            descriptionAdditionalLine?: string | null;
        };
        /**
         * @description A public event name that can be enabled for a webhook endpoint. The
         *     `webhook.setup` verification event is deliberately excluded: Vatly sends
         *     that event whenever it verifies endpoint configuration, regardless of the
         *     endpoint's subscriptions.
         * @example order.paid
         * @enum {string}
         */
        WebhookSubscriptionEventName: "checkout.canceled" | "checkout.expired" | "checkout.failed" | "checkout.paid" | "one_off_product.archived" | "one_off_product.unarchived" | "one_off_product.update_approved" | "one_off_product.update_rejected" | "one_off_product.update_submitted" | "order.canceled" | "order.chargeback_received" | "order.chargeback_reversed" | "order.paid" | "order.payment_failed" | "refund.canceled" | "refund.completed" | "refund.failed" | "subscription.billing_updated" | "subscription.canceled_for_nonpayment" | "subscription.canceled_immediately" | "subscription.canceled_with_grace_period" | "subscription.cancellation_grace_period_completed" | "subscription.resumed" | "subscription.started" | "subscription.update_scheduled" | "subscription.updated" | "subscription_plan.archived" | "subscription_plan.unarchived" | "subscription_plan.update_approved" | "subscription_plan.update_rejected" | "subscription_plan.update_submitted";
        FastForwardSubscriptionRenewalRequest: {
            /**
             * @description Deterministic outcome to simulate for the test-mode renewal payment. The
             *     helper uses a local payment and does not submit a charge to the provider
             *     sandbox, so a provider response cannot override this requested status.
             *
             *     Omit it to advance the billing cycle and leave that local payment
             *     pending, which is this endpoint's original behaviour.
             *
             *     `failed` declines the payment and starts a payment recovery for the
             *     renewal order, so `order.payment_failed` is delivered to your webhook
             *     endpoint. `paid` settles it.
             * @example failed
             * @enum {string}
             */
            paymentStatus?: "paid" | "failed";
            /**
             * @description Which decline to simulate. Only valid alongside `paymentStatus: failed`;
             *     sending it with `paid` is rejected.
             *
             *     The reason decides how the payment recovery proceeds. A soft decline
             *     (`insufficient_funds`, `temporary_decline`, `general_failure`) means the
             *     payment method is still good, so recovery retries on a multi-week
             *     timeline. Every other value is a hard decline: the payment method is
             *     dead, retrying is pointless, and recovery instead drives the customer to
             *     supply a new one on a short timeline.
             *
             *     Defaults to `general_failure`, which is soft.
             * @default general_failure
             * @example card_expired
             * @enum {string}
             */
            failureReason?: "insufficient_funds" | "temporary_decline" | "general_failure" | "invalid_mandate" | "mandate_canceled" | "account_closed" | "card_expired" | "card_lost_or_stolen" | "invalid_card_details" | "authentication_failed" | "fraud_suspected";
        };
        SimulateOrderPaymentRequest: {
            /**
             * @description Outcome to force on the order's pending payment.
             *
             *     `paid` settles it, so `order.paid` is delivered to your webhook endpoint.
             *     `failed` declines it and starts a payment recovery, so
             *     `order.payment_failed` is delivered.
             * @example paid
             * @enum {string}
             */
            paymentStatus: "paid" | "failed";
            /**
             * @description Which decline to simulate. Only valid alongside `paymentStatus: failed`;
             *     sending it with `paid` is rejected.
             *
             *     The reason decides how the payment recovery proceeds. A soft decline
             *     (`insufficient_funds`, `temporary_decline`, `general_failure`) means the
             *     payment method is still good, so recovery retries on a multi-week
             *     timeline. Every other value is a hard decline: the payment method is
             *     dead, retrying is pointless, and recovery instead drives the customer to
             *     supply a new one on a short timeline.
             *
             *     Defaults to `general_failure`, which is soft.
             * @default general_failure
             * @example card_expired
             * @enum {string}
             */
            failureReason?: "insufficient_funds" | "temporary_decline" | "general_failure" | "invalid_mandate" | "mandate_canceled" | "account_closed" | "card_expired" | "card_lost_or_stolen" | "invalid_card_details" | "authentication_failed" | "fraud_suspected";
        };
        /**
         * @description A registered webhook endpoint configuration — the subject of a `webhook.setup`
         *     verification call. Never includes the signing secret.
         */
        Webhook: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            resource: "webhook";
            /**
             * @description The webhook endpoint identifier.
             * @example webhook_QdEpFhdSrG4Y3DnfsdqsH
             */
            id: string;
            /**
             * Format: uri
             * @description The endpoint the verification call was sent to.
             * @example https://merchant.example/webhooks/vatly
             */
            url: string;
            /** @example true */
            testmode: boolean;
        };
        /**
         * @description The envelope Vatly POSTs to your configured webhook endpoint for each delivery.
         *
         *     Identical to the persisted `WebhookEvent`, with two differences that exist only on
         *     the wire:
         *       - it additionally covers the `webhook.setup` verification call (`entityType`
         *         `webhook`, `object` is the secret-free endpoint config), and
         *       - that setup call is not persisted and omits `links`, so `links` is not required
         *         on a delivery.
         *
         *     Every delivery is signed: the `Vatly-Signature` header carries an HMAC-SHA256 of
         *     the raw body and `Vatly-Event-Id` carries a retry-stable dedup key (see the
         *     operation parameters).
         */
        WebhookDelivery: {
            /**
             * @description Unique identifier for the webhook event
             * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
             */
            id: string;
            /**
             * @description Resource type identifier
             * @example webhook_event
             * @constant
             */
            resource: "webhook_event";
            /**
             * @description Name of the event that triggered this webhook:
             *     - `order.paid` - Order payment was successful
             *     - `order.canceled` - Order was canceled
             *     - `order.chargeback_received` - Chargeback was received for an order
             *     - `order.chargeback_reversed` - Chargeback was reversed
             *     - `order.payment_failed` - A payment failed and the order entered payment recovery (dunning); sent once per failed order
             *     - `refund.completed` - Refund was processed successfully
             *     - `refund.failed` - Refund processing failed
             *     - `refund.canceled` - Refund was canceled
             *     - `subscription.started` - Subscription was started
             *     - `subscription.canceled_immediately` - Subscription was canceled immediately
             *     - `subscription.canceled_for_nonpayment` - Subscription was canceled because payment recovery was exhausted
             *     - `subscription.canceled_with_grace_period` - Subscription was canceled with a grace period
             *     - `subscription.cancellation_grace_period_completed` - Subscription grace period ended
             *     - `subscription.resumed` - A canceled subscription was resumed during its grace period
             *     - `subscription.billing_updated` - A subscription's billing details changed; in practice today the mandate (payment method on file), e.g. to refresh the masked payment method identifier shown to the customer
             *     - `subscription.updated` - A subscription changed: on an immediate change, when a scheduled change takes effect at renewal, or when a renewal payment is confirmed; see `reason`
             *     - `subscription.update_scheduled` - A plan/price/quantity change was scheduled for the next billing cycle; the target values are in `object.scheduledUpdate`
             *     - `checkout.paid` - Checkout was paid successfully
             *     - `checkout.failed` - Checkout payment failed
             *     - `checkout.canceled` - Checkout was canceled
             *     - `checkout.expired` - Checkout session expired
             *     - `webhook.setup` - Verification call sent when an endpoint is registered or its URL changes (`entityType` is `webhook`)
             *
             *     This list is the single source of truth for SDK generators and is kept in
             *     sync with the webhook transformer registry by `php artisan openapi:audit-webhook-drift`.
             * @example order.paid
             * @enum {string}
             */
            eventName: "order.paid" | "order.canceled" | "order.chargeback_received" | "order.chargeback_reversed" | "order.payment_failed" | "refund.completed" | "refund.failed" | "refund.canceled" | "subscription.started" | "subscription.canceled_immediately" | "subscription.canceled_for_nonpayment" | "subscription.canceled_with_grace_period" | "subscription.cancellation_grace_period_completed" | "subscription.resumed" | "subscription.billing_updated" | "subscription.updated" | "subscription.update_scheduled" | "checkout.paid" | "checkout.failed" | "checkout.canceled" | "checkout.expired" | "one_off_product.update_submitted" | "one_off_product.update_approved" | "one_off_product.update_rejected" | "one_off_product.archived" | "one_off_product.unarchived" | "subscription_plan.update_submitted" | "subscription_plan.update_approved" | "subscription_plan.update_rejected" | "subscription_plan.archived" | "subscription_plan.unarchived" | "webhook.setup";
            /**
             * @description Why the event fired, for events that have more than one cause. Always
             *     present; `null` for every event other than `subscription.updated`.
             *
             *     For `subscription.updated`:
             *     - `updated_immediately` - A plan, price, interval or quantity change took effect immediately
             *     - `updated_on_renewal` - A scheduled plan, price, interval or quantity change took effect at a renewal
             *     - `renewed` - A renewal payment was confirmed; `renewedAt` and `renewedUntil` moved
             *
             *     New values may be added; treat an unknown value as a generic change.
             * @example renewed
             */
            reason: string | null;
            /**
             * @description Type of the resource this event relates to
             * @example order
             */
            entityType: string;
            /**
             * @description ID of the resource this event relates to
             * @example order_Hn5xWqVfKm8RjTgYbUcP
             */
            entityId: string;
            /**
             * @description The full resource payload at the time of the event, serialized identically
             *     to the corresponding REST resource. The concrete shape is selected by the
             *     payload's own `resource` field (the discriminator):
             *       - `order.paid`, `order.canceled`, `order.payment_failed` → Order
             *       - `order.chargeback_received`, `order.chargeback_reversed` → Chargeback
             *       - `refund.*` → Refund
             *       - `subscription.*` → Subscription
             *       - `checkout.*` → Checkout
             *       - `webhook.setup` → Webhook (the endpoint config; verification handshake)
             *       - `one_off_product.*` → OneOffProduct
             *       - `subscription_plan.*` → SubscriptionPlan
             *
             *     Note `object.resource` may differ from `entityType`: chargeback events carry
             *     `entityType: order` (the order the chargeback belongs to) but a Chargeback object.
             */
            object: components["schemas"]["Order"] | components["schemas"]["Chargeback"] | components["schemas"]["Refund"] | components["schemas"]["Subscription"] | components["schemas"]["Checkout"] | components["schemas"]["OneOffProduct"] | components["schemas"]["SubscriptionPlan"] | components["schemas"]["Webhook"];
            /**
             * Format: date-time
             * @description ISO 8601 timestamp of when the webhook event was created.
             * @example 2026-05-21T14:32:08+00:00
             */
            createdAt: string;
            /**
             * @description Whether the event originated from a test-mode resource.
             *     `true` for events created with a `test_` prefixed token, `false` for live events.
             * @example false
             */
            testmode: boolean;
            /**
             * @description HATEOAS links to related resources. Present on event deliveries; omitted on
             *     the `webhook.setup` verification call, which is not a persisted resource.
             */
            links?: {
                /** @description Link to this webhook event resource */
                self: components["schemas"]["Link"];
            };
        };
    };
    responses: {
        /**
         * @description Catch-all for any status not explicitly enumerated on the operation.
         *     Branch on the HTTP status code:
         *     - `400` Bad Request — malformed request (e.g. invalid JSON body)
         *     - `429` Too Many Requests — rate limit exceeded; the `Retry-After`
         *       header gives the number of seconds to wait before retrying
         *     - `500` Internal Server Error — an unexpected error occurred; the
         *       request can typically be retried
         *
         *     The body is always the standard `Error` shape.
         */
        UnexpectedError: {
            headers: {
                /**
                 * @description Present on `429` responses — seconds to wait before retrying.
                 * @example 60
                 */
                "Retry-After"?: number;
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "message": "An unexpected error occurred. Please try again later."
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Unauthorized - Authentication credentials were missing or invalid */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "message": "Unauthenticated."
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
        /**
         * @description Forbidden - The API token is invalid or does not have permission for this operation.
         *     Common causes:
         *     - Token does not start with `live_` or `test_`
         *     - Token has been revoked
         *     - Attempting live operations on a non-live merchant account
         */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "message": "Auth token must start with live_ or test_."
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
        /**
         * @description Unprocessable Entity - The request was well-formed but contained validation errors.
         *     The `errors` object contains field-specific error messages.
         */
        ValidationFailed: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "message": "The given data was invalid.",
                 *       "errors": {
                 *         "email": [
                 *           "The email field is required.",
                 *           "The email must be a valid email address."
                 *         ],
                 *         "products.0.id": [
                 *           "The selected products.0.id is invalid."
                 *         ]
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["ValidationError"];
            };
        };
        /**
         * @description Conflict — The request could not be completed because of one of
         *     the following:
         *
         *     - **Idempotency replay mismatch** (`Idempotency-Key` reused with
         *       different request parameters). Retry with the original parameters
         *       or generate a new key.
         *     - **Idempotency request in progress**
         *       (`details.idempotency_outcome = in_progress`). Wait the
         *       `Retry-After` interval, then retry the exact request with the same key.
         *     - **Idempotency outcome unknown**
         *       (`details.idempotency_outcome = unknown`). This is not retryable: read
         *       and reconcile resource/provider state before another mutation.
         *     - **Optimistic concurrency conflict** (two writers modifying the
         *       same resource at the same version). Reload the latest state
         *       and retry — the conflict resolves itself unless contention is
         *       sustained.
         *     - **Refund already being created for this order**
         *       (`details.retry_with_new_idempotency_key = true`). Another refund of
         *       the same order is still being created. This response is stored for the
         *       `Idempotency-Key` you sent, so retry with a new key.
         *
         *     The HTTP status (`409`) is shared by all cases; the `message`
         *     distinguishes them.
         */
        Conflict: {
            headers: {
                /**
                 * @description Present only for `in_progress`; seconds before retrying the exact request and key.
                 * @example 2
                 */
                "Retry-After"?: number;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Not Found - The requested resource does not exist */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                /**
                 * @example {
                 *       "message": "Checkout not found."
                 *     }
                 */
                "application/json": components["schemas"]["Error"];
            };
        };
        /**
         * @description Acknowledged. Return any 2xx status to confirm receipt. A non-2xx response
         *     or a timeout causes Vatly to retry the delivery with backoff.
         */
        Acknowledged: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
        /**
         * @description Endpoint reachable. Return any 2xx status to confirm. Unlike event
         *     deliveries, the setup call is a synchronous verification check: a non-2xx
         *     response or timeout fails endpoint registration/verification and is NOT
         *     retried.
         */
        SetupAcknowledged: {
            headers: {
                [name: string]: unknown;
            };
            content?: never;
        };
    };
    parameters: {
        /**
         * @description Maximum number of results to return per page
         * @example 25
         */
        limit: number;
        /**
         * @description Cursor for forward pagination.
         *     Returns results after this resource ID.
         *     Mutually exclusive with `endingBefore`.
         * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
         */
        startingAfter: string;
        /**
         * @description Cursor for backward pagination.
         *     Returns results before this resource ID.
         *     Mutually exclusive with `startingAfter`.
         * @example checkout_Rk5pQrSvWm8NjLhYbUcP
         */
        endingBefore: string;
        /**
         * @description A unique key the client generates per logical mutating operation to
         *     make retries safe. Vatly stores the first response keyed by
         *     `(token, endpoint, key)` and returns it verbatim on subsequent
         *     requests with the same key, setting `Idempotent-Replayed: true` on
         *     the replayed response.
         *
         *     Keys bind to the HTTP method, public endpoint, concrete path, query,
         *     request body, normalized `Content-Type` media type, and normalized
         *     ordered `Content-Encoding`. Media type and content encoding are
         *     contract-significant: changing either on a replay returns `409 Conflict`
         *     without executing the operation again. Keys are scoped per public route
         *     URI template and retained for 24 hours; internal route-name changes do
         *     not affect replay identity.
         *
         *     Recommended format: UUIDv4. Send on every mutating request
         *     (POST, PATCH, PUT, DELETE) where retry safety matters.
         * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
         */
        idempotencyKey: string;
        /**
         * @description Unique identifier of the checkout
         * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
         */
        checkoutId: string;
        /**
         * @description Return customers with this email address, within the storefront and mode
         *     the API token is scoped to.
         *
         *     Canonicalized before matching, exactly as on write — see the `email`
         *     field of the customer schema. Beyond that the comparison is exact, so
         *     `büyer@example.com` does not match `buyer@example.com`.
         *
         *     An address can be held by more than one customer, in which case all of
         *     them are returned. A value that is not a valid email address returns
         *     `422`.
         * @example john.doe@example.com
         */
        customerEmailFilter: string;
        /**
         * @description Unique identifier of the customer
         * @example customer_7kBmRtPvXw2NjLhYcZaE
         */
        customerId: string;
        /**
         * @description Unique identifier of the subscription
         * @example subscription_Lp3mNvBxKw7RjTgYcZaE
         */
        subscriptionId: string;
        /**
         * @description Include archived entries in the catalogue listing. Archived entries are
         *     hidden by default because they cannot be sold; set this to `true` to see
         *     them alongside the live ones (tell them apart by the non-null
         *     `archivedAt`).
         * @example true
         */
        includeArchived: boolean;
        /**
         * @description Unique identifier of the one-off product
         * @example one_off_product_Vr8kQdFhSrG4Y3DnfsdqH
         */
        oneOffProductId: string;
        /**
         * @description Unique identifier of the subscription plan
         * @example subscription_plan_Wt5mNvBxKw7YcZaEjLhR
         */
        subscriptionPlanId: string;
        /**
         * @description Unique identifier of the order
         * @example order_Hn5xWqVfKm8RjTgYbUcP
         */
        orderId: string;
        /**
         * @description Unique identifier of the refund
         * @example refund_Xk9pQrSvWm4NjLhYbUcP
         */
        refundId: string;
        /**
         * @description Unique identifier of the chargeback
         * @example chargeback_Mn6xBtPvKw2RjTgYcZaE
         */
        chargebackId: string;
        /**
         * @description Unique identifier of the webhook event
         * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
         */
        eventId: string;
        /**
         * @description Unique identifier of the webhook endpoint
         * @example webhook_QdEpFhdSrG4Y3DnfsdqsH
         */
        webhookEndpointId: string;
        /**
         * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
         *     Recompute it over the exact bytes received and compare before trusting the payload.
         *     A fresh signature is sent on every delivery attempt (initial and retries).
         * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
         */
        VatlySignature: string;
        /**
         * @description Stable identifier for this event, constant across delivery retries. Use it as an
         *     idempotency / dedup key so a retried delivery is not processed twice.
         * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
         */
        VatlyEventId: string;
    };
    requestBodies: {
        WebhookDelivery: {
            content: {
                "application/json": components["schemas"]["WebhookDelivery"];
            };
        };
    };
    headers: {
        /**
         * @description Present and set to `true` when the response was replayed from a
         *     previously stored result keyed by `Idempotency-Key`. Absent (or
         *     `false`) for first-time requests.
         * @example true
         */
        IdempotentReplayed: boolean;
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listCheckouts: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of checkouts */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "checkout_QdEpFhdSrG4Y3DnfsdqsH",
                     *           "resource": "checkout",
                     *           "customerId": null,
                     *           "orderId": null,
                     *           "testmode": false,
                     *           "redirectUrlSuccess": "https://example.com/success",
                     *           "redirectUrlCanceled": "https://example.com/canceled",
                     *           "metadata": {},
                     *           "locale": null,
                     *           "status": "created",
                     *           "expiresAt": "2024-01-16T10:30:00Z",
                     *           "createdAt": "2024-01-15T10:30:00Z",
                     *           "links": {
                     *             "checkoutUrl": {
                     *               "href": "https://checkout.vatly.com/checkout_QdEpFhdSrG4Y3DnfsdqsH",
                     *               "type": "text/html"
                     *             },
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/checkouts/checkout_QdEpFhdSrG4Y3DnfsdqsH",
                     *               "type": "application/json"
                     *             },
                     *             "order": null
                     *           }
                     *         }
                     *       ],
                     *       "count": 1,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/checkouts",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["Checkout"][];
                        /**
                         * @description Number of items in the current page
                         * @example 1
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    createCheckout: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCheckoutRequest"];
            };
        };
        responses: {
            /** @description Checkout created successfully */
            201: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "checkout_Bm7xNvPwKr3YjTgHcZaE",
                     *       "resource": "checkout",
                     *       "customerId": null,
                     *       "orderId": null,
                     *       "testmode": false,
                     *       "redirectUrlSuccess": "https://example.com/success",
                     *       "redirectUrlCanceled": "https://example.com/canceled",
                     *       "metadata": {
                     *         "campaign": "summer-sale"
                     *       },
                     *       "locale": "de",
                     *       "status": "created",
                     *       "expiresAt": "2024-01-16T10:30:00Z",
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "checkoutUrl": {
                     *           "href": "https://checkout.vatly.com/checkout_Bm7xNvPwKr3YjTgHcZaE",
                     *           "type": "text/html"
                     *         },
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/checkouts/checkout_Bm7xNvPwKr3YjTgHcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "order": null
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Checkout"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            /**
             * @description Unprocessable Entity - The request was well-formed but contained validation errors.
             *     This includes the case where a referenced resource (e.g. `customerId`) exists but
             *     was created in a different mode — switch between live/test API tokens to access it.
             */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationError"];
                };
            };
            default: components["responses"]["UnexpectedError"];
        };
    };
    getCheckout: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the checkout
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                checkoutId: components["parameters"]["checkoutId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Checkout details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "checkout_QdEpFhdSrG4Y3DnfsdqsH",
                     *       "resource": "checkout",
                     *       "customerId": "customer_7kBmRtPvXw2NjLhYcZaE",
                     *       "orderId": "order_Jk4pQrSvWm8NjLhYbUcP",
                     *       "testmode": false,
                     *       "redirectUrlSuccess": "https://example.com/return?checkout_id=checkout_QdEpFhdSrG4Y3DnfsdqsH",
                     *       "redirectUrlCanceled": "https://example.com/canceled",
                     *       "metadata": {
                     *         "campaign": "summer-sale"
                     *       },
                     *       "locale": null,
                     *       "status": "paid",
                     *       "expiresAt": "2024-01-16T10:30:00Z",
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "checkoutUrl": {
                     *           "href": "https://checkout.vatly.com/checkout_QdEpFhdSrG4Y3DnfsdqsH",
                     *           "type": "text/html"
                     *         },
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/checkouts/checkout_QdEpFhdSrG4Y3DnfsdqsH",
                     *           "type": "application/json"
                     *         },
                     *         "order": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Jk4pQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Checkout"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listCustomers: {
        parameters: {
            query?: {
                /**
                 * @description Return customers with this email address, within the storefront and mode
                 *     the API token is scoped to.
                 *
                 *     Canonicalized before matching, exactly as on write — see the `email`
                 *     field of the customer schema. Beyond that the comparison is exact, so
                 *     `büyer@example.com` does not match `buyer@example.com`.
                 *
                 *     An address can be held by more than one customer, in which case all of
                 *     them are returned. A value that is not a valid email address returns
                 *     `422`.
                 * @example john.doe@example.com
                 */
                email?: components["parameters"]["customerEmailFilter"];
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of customers */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "customer_7kBmRtPvXw2NjLhYcZaE",
                     *           "resource": "customer",
                     *           "testmode": false,
                     *           "email": "john.doe@example.com",
                     *           "name": "John Doe",
                     *           "createdAt": "2024-01-15T10:30:00Z",
                     *           "metadata": {
                     *             "userId": "user_Qp8kNvBxKw7RjTgYcZaE"
                     *           },
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/customers/customer_7kBmRtPvXw2NjLhYcZaE",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         },
                     *         {
                     *           "id": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "resource": "customer",
                     *           "testmode": false,
                     *           "email": "jane.smith@acme.com",
                     *           "name": "Jane Smith",
                     *           "createdAt": "2024-01-10T08:15:00Z",
                     *           "metadata": {},
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/customers/customer_Lp3mNvBxKw7RjTgYcZaE",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 2,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/customers",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["Customer"][];
                        /**
                         * @description Number of items in the current page
                         * @example 2
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    createCustomer: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "email": "customer@example.com",
                 *       "metadata": {
                 *         "userId": "user_Qp8kNvBxKw7RjTgYcZaE"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["CreateCustomerRequest"];
            };
        };
        responses: {
            /**
             * @description A customer with this email already existed. It is returned unchanged —
             *     nothing in the request body was applied.
             */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "customer_7kBmRtPvXw2NjLhYcZaE",
                     *       "resource": "customer",
                     *       "testmode": false,
                     *       "email": "customer@example.com",
                     *       "name": "John Doe",
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "metadata": {
                     *         "userId": "user_Qp8kNvBxKw7RjTgYcZaE"
                     *       },
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_7kBmRtPvXw2NjLhYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Customer"];
                };
            };
            /** @description Customer created successfully */
            201: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "customer_7kBmRtPvXw2NjLhYcZaE",
                     *       "resource": "customer",
                     *       "testmode": false,
                     *       "email": "customer@example.com",
                     *       "name": "John Doe",
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "metadata": {
                     *         "userId": "user_Qp8kNvBxKw7RjTgYcZaE"
                     *       },
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_7kBmRtPvXw2NjLhYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Customer"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getCustomer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the customer
                 * @example customer_7kBmRtPvXw2NjLhYcZaE
                 */
                customerId: components["parameters"]["customerId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Customer details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "customer_7kBmRtPvXw2NjLhYcZaE",
                     *       "resource": "customer",
                     *       "testmode": false,
                     *       "email": "john.doe@example.com",
                     *       "name": "John Doe",
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "metadata": {
                     *         "userId": "user_Qp8kNvBxKw7RjTgYcZaE"
                     *       },
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_7kBmRtPvXw2NjLhYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Customer"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    updateCustomer: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the customer
                 * @example customer_7kBmRtPvXw2NjLhYcZaE
                 */
                customerId: components["parameters"]["customerId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "John Doe",
                 *       "email": "new.email@example.com"
                 *     }
                 */
                "application/json": components["schemas"]["UpdateCustomerRequest"];
            };
        };
        responses: {
            /** @description Customer updated successfully */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "customer_7kBmRtPvXw2NjLhYcZaE",
                     *       "resource": "customer",
                     *       "testmode": false,
                     *       "email": "new.email@example.com",
                     *       "name": "John Doe",
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "metadata": {
                     *         "userId": "user_Qp8kNvBxKw7RjTgYcZaE"
                     *       },
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_7kBmRtPvXw2NjLhYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Customer"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    createCustomerPortalSession: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the customer
                 * @example customer_7kBmRtPvXw2NjLhYcZaE
                 */
                customerId: components["parameters"]["customerId"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                /**
                 * @example {
                 *       "returnUrl": "https://merchant.example/account/billing"
                 *     }
                 */
                "application/json": components["schemas"]["CreatePortalSessionRequest"];
            };
        };
        responses: {
            /** @description Hosted customer portal session created */
            201: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    /** @description Prevents storage of the credential-bearing response. */
                    "Cache-Control"?: string;
                    /** @description Legacy proxy fallback preventing storage of the credential-bearing response. */
                    Pragma?: string;
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "url": "https://billing.vatly.com/authenticate?credential=...",
                     *       "expiresAt": "2026-09-01T12:15:00Z",
                     *       "returnUrl": "https://merchant.example/account/billing"
                     *     }
                     */
                    "application/json": components["schemas"]["PortalSession"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listCustomerSubscriptions: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the customer
                 * @example customer_7kBmRtPvXw2NjLhYcZaE
                 */
                customerId: components["parameters"]["customerId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of customer's subscriptions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *           "resource": "subscription",
                     *           "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "subscriptionPlanId": "subscription_plan_Rk5pQrSvWm8NjLhYbUcP",
                     *           "testmode": false,
                     *           "name": "Pro Monthly",
                     *           "description": "Full access to all Pro features",
                     *           "billingAddress": {
                     *             "fullName": "John Doe",
                     *             "companyName": "Acme Corp",
                     *             "streetAndNumber": "123 Main Street",
                     *             "city": "Berlin",
                     *             "postalCode": "10115",
                     *             "country": "DE"
                     *           },
                     *           "basePrice": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "quantity": 1,
                     *           "interval": "month",
                     *           "intervalCount": 1,
                     *           "status": "active",
                     *           "cancellationReason": null,
                     *           "mandate": {
                     *             "method": "card",
                     *             "maskedIdentifier": "4242"
                     *           },
                     *           "startedAt": "2024-01-15T10:30:00Z",
                     *           "endedAt": null,
                     *           "canceledAt": null,
                     *           "renewedAt": "2024-02-15T10:30:00Z",
                     *           "renewedUntil": "2024-03-15T10:30:00Z",
                     *           "nextRenewalAt": "2024-03-15T10:30:00Z",
                     *           "trialUntil": null,
                     *           "scheduledUpdate": null,
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/subscriptions/subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *               "type": "application/json"
                     *             },
                     *             "customer": {
                     *               "href": "https://api.vatly.com/v1/customers/customer_Lp3mNvBxKw7RjTgYcZaE",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 1,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_Lp3mNvBxKw7RjTgYcZaE/subscriptions",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["Subscription"][];
                        /**
                         * @description Number of items in the current page
                         * @example 1
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getCustomerSubscription: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the customer
                 * @example customer_7kBmRtPvXw2NjLhYcZaE
                 */
                customerId: components["parameters"]["customerId"];
                /**
                 * @description Unique identifier of the subscription
                 * @example subscription_Lp3mNvBxKw7RjTgYcZaE
                 */
                subscriptionId: components["parameters"]["subscriptionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Subscription details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *       "resource": "subscription",
                     *       "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *       "subscriptionPlanId": "subscription_plan_Rk5pQrSvWm8NjLhYbUcP",
                     *       "testmode": false,
                     *       "name": "Pro Monthly",
                     *       "description": "Full access to all Pro features",
                     *       "billingAddress": {
                     *         "fullName": "John Doe",
                     *         "companyName": "Acme Corp",
                     *         "streetAndNumber": "123 Main Street",
                     *         "city": "Berlin",
                     *         "postalCode": "10115",
                     *         "country": "DE"
                     *       },
                     *       "basePrice": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "quantity": 1,
                     *       "interval": "month",
                     *       "intervalCount": 1,
                     *       "status": "active",
                     *       "cancellationReason": null,
                     *       "mandate": {
                     *         "method": "card",
                     *         "maskedIdentifier": "4242"
                     *       },
                     *       "startedAt": "2024-01-15T10:30:00Z",
                     *       "endedAt": null,
                     *       "canceledAt": null,
                     *       "renewedAt": "2024-02-15T10:30:00Z",
                     *       "renewedUntil": "2024-03-15T10:30:00Z",
                     *       "nextRenewalAt": "2024-03-15T10:30:00Z",
                     *       "trialUntil": null,
                     *       "scheduledUpdate": null,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscriptions/subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "customer": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Subscription"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listOneOffProducts: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
                /**
                 * @description Include archived entries in the catalogue listing. Archived entries are
                 *     hidden by default because they cannot be sold; set this to `true` to see
                 *     them alongside the live ones (tell them apart by the non-null
                 *     `archivedAt`).
                 * @example true
                 */
                includeArchived?: components["parameters"]["includeArchived"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of one-off products */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *           "resource": "one_off_product",
                     *           "testmode": false,
                     *           "name": "Premium License",
                     *           "description": "Lifetime access to all premium features",
                     *           "basePrice": {
                     *             "value": "299.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxBehavior": "exclusive",
                     *           "productType": "saas",
                     *           "status": "active",
                     *           "archivedAt": null,
                     *           "createdAt": "2024-01-15T10:30:00Z",
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/one-off-products/one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 1,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/one-off-products",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["OneOffProduct"][];
                        /**
                         * @description Number of items in the current page
                         * @example 1
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    createOneOffProduct: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Premium License",
                 *       "description": "Lifetime access to all premium features",
                 *       "basePrice": {
                 *         "value": "299.00",
                 *         "currency": "EUR"
                 *       },
                 *       "productType": "saas"
                 *     }
                 */
                "application/json": components["schemas"]["CreateOneOffProductRequest"];
            };
        };
        responses: {
            /** @description One-off product created successfully */
            201: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *       "resource": "one_off_product",
                     *       "testmode": false,
                     *       "name": "Premium License",
                     *       "description": "Lifetime access to all premium features",
                     *       "basePrice": {
                     *         "value": "299.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxBehavior": "exclusive",
                     *       "productType": "saas",
                     *       "status": "pending",
                     *       "archivedAt": null,
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/one-off-products/one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["OneOffProduct"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getOneOffProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the one-off product
                 * @example one_off_product_Vr8kQdFhSrG4Y3DnfsdqH
                 */
                oneOffProductId: components["parameters"]["oneOffProductId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One-off product details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *       "resource": "one_off_product",
                     *       "testmode": false,
                     *       "name": "Premium License",
                     *       "description": "Lifetime access to all premium features",
                     *       "basePrice": {
                     *         "value": "299.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxBehavior": "exclusive",
                     *       "productType": "saas",
                     *       "status": "active",
                     *       "archivedAt": null,
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/one-off-products/one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["OneOffProduct"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    updateOneOffProduct: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the one-off product
                 * @example one_off_product_Vr8kQdFhSrG4Y3DnfsdqH
                 */
                oneOffProductId: components["parameters"]["oneOffProductId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Premium License v2",
                 *       "basePrice": {
                 *         "value": "349.00",
                 *         "currency": "EUR"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["UpdateOneOffProductRequest"];
            };
        };
        responses: {
            /** @description Update submitted; the product now carries a pending update. */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *       "resource": "one_off_product",
                     *       "testmode": false,
                     *       "name": "Premium License",
                     *       "description": "Lifetime access to all premium features",
                     *       "basePrice": {
                     *         "value": "299.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxBehavior": "exclusive",
                     *       "productType": "saas",
                     *       "status": "active",
                     *       "archivedAt": null,
                     *       "pendingUpdates": {
                     *         "name": "Premium License v2",
                     *         "basePrice": {
                     *           "value": "349.00",
                     *           "currency": "EUR"
                     *         }
                     *       },
                     *       "updateStatus": "pending",
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/one-off-products/one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["OneOffProduct"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    archiveOneOffProduct: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the one-off product
                 * @example one_off_product_Vr8kQdFhSrG4Y3DnfsdqH
                 */
                oneOffProductId: components["parameters"]["oneOffProductId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Product archived (or already archived). */
            204: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    unarchiveOneOffProduct: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the one-off product
                 * @example one_off_product_Vr8kQdFhSrG4Y3DnfsdqH
                 */
                oneOffProductId: components["parameters"]["oneOffProductId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The product, now on sale again. */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *       "resource": "one_off_product",
                     *       "testmode": false,
                     *       "name": "Premium License",
                     *       "description": "Lifetime access to all premium features",
                     *       "basePrice": {
                     *         "value": "299.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxBehavior": "exclusive",
                     *       "productType": "saas",
                     *       "status": "active",
                     *       "archivedAt": null,
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/one-off-products/one_off_product_Vr8kQdFhSrG4Y3DnfsdqH",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["OneOffProduct"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listSubscriptionPlans: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
                /**
                 * @description Include archived entries in the catalogue listing. Archived entries are
                 *     hidden by default because they cannot be sold; set this to `true` to see
                 *     them alongside the live ones (tell them apart by the non-null
                 *     `archivedAt`).
                 * @example true
                 */
                includeArchived?: components["parameters"]["includeArchived"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of subscription plans */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "subscription_plan_Bm7xNvPwKr3YjTgHcZaE",
                     *           "resource": "subscription_plan",
                     *           "testmode": false,
                     *           "name": "Pro Monthly",
                     *           "description": "Full access to all Pro features, billed monthly",
                     *           "basePrice": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxBehavior": "exclusive",
                     *           "interval": "month",
                     *           "intervalCount": 1,
                     *           "productType": "saas",
                     *           "status": "active",
                     *           "archivedAt": null,
                     *           "createdAt": "2024-01-15T10:30:00Z",
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/subscription-plans/subscription_plan_Bm7xNvPwKr3YjTgHcZaE",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         },
                     *         {
                     *           "id": "subscription_plan_Wt5mNvBxKw7YcZaEjLhR",
                     *           "resource": "subscription_plan",
                     *           "testmode": false,
                     *           "name": "Pro Yearly",
                     *           "description": "Full access to all Pro features, billed yearly",
                     *           "basePrice": {
                     *             "value": "290.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxBehavior": "exclusive",
                     *           "interval": "year",
                     *           "intervalCount": 1,
                     *           "productType": "saas",
                     *           "status": "active",
                     *           "archivedAt": null,
                     *           "createdAt": "2024-01-15T10:30:00Z",
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/subscription-plans/subscription_plan_Wt5mNvBxKw7YcZaEjLhR",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 2,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscription-plans",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["SubscriptionPlan"][];
                        /**
                         * @description Number of items in the current page
                         * @example 2
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    createSubscriptionPlan: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Pro Monthly",
                 *       "description": "Full access to all Pro features, billed monthly",
                 *       "basePrice": {
                 *         "value": "29.00",
                 *         "currency": "EUR"
                 *       },
                 *       "productType": "saas",
                 *       "interval": "month",
                 *       "intervalCount": 1
                 *     }
                 */
                "application/json": components["schemas"]["CreateSubscriptionPlanRequest"];
            };
        };
        responses: {
            /** @description Subscription plan created successfully */
            201: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "subscription_plan_Bm7xNvPwKr3YjTgHcZaE",
                     *       "resource": "subscription_plan",
                     *       "testmode": false,
                     *       "name": "Pro Monthly",
                     *       "description": "Full access to all Pro features, billed monthly",
                     *       "basePrice": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxBehavior": "exclusive",
                     *       "interval": "month",
                     *       "intervalCount": 1,
                     *       "productType": "saas",
                     *       "status": "pending",
                     *       "archivedAt": null,
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscription-plans/subscription_plan_Bm7xNvPwKr3YjTgHcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["SubscriptionPlan"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getSubscriptionPlan: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the subscription plan
                 * @example subscription_plan_Wt5mNvBxKw7YcZaEjLhR
                 */
                subscriptionPlanId: components["parameters"]["subscriptionPlanId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Subscription plan details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "subscription_plan_Bm7xNvPwKr3YjTgHcZaE",
                     *       "resource": "subscription_plan",
                     *       "testmode": false,
                     *       "name": "Pro Monthly",
                     *       "description": "Full access to all Pro features, billed monthly",
                     *       "basePrice": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxBehavior": "exclusive",
                     *       "interval": "month",
                     *       "intervalCount": 1,
                     *       "productType": "saas",
                     *       "status": "active",
                     *       "archivedAt": null,
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscription-plans/subscription_plan_Bm7xNvPwKr3YjTgHcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["SubscriptionPlan"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    updateSubscriptionPlan: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the subscription plan
                 * @example subscription_plan_Wt5mNvBxKw7YcZaEjLhR
                 */
                subscriptionPlanId: components["parameters"]["subscriptionPlanId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "name": "Pro Weekly",
                 *       "basePrice": {
                 *         "value": "9.00",
                 *         "currency": "EUR"
                 *       },
                 *       "interval": "week",
                 *       "intervalCount": 1
                 *     }
                 */
                "application/json": components["schemas"]["UpdateSubscriptionPlanRequest"];
            };
        };
        responses: {
            /** @description Update submitted; the plan now carries a pending update. */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "subscription_plan_Bm7xNvPwKr3YjTgHcZaE",
                     *       "resource": "subscription_plan",
                     *       "testmode": false,
                     *       "name": "Pro Monthly",
                     *       "description": "Full access to all Pro features, billed monthly",
                     *       "basePrice": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxBehavior": "exclusive",
                     *       "interval": "month",
                     *       "intervalCount": 1,
                     *       "productType": "saas",
                     *       "status": "active",
                     *       "archivedAt": null,
                     *       "pendingUpdates": {
                     *         "name": "Pro Weekly",
                     *         "basePrice": {
                     *           "value": "9.00",
                     *           "currency": "EUR"
                     *         },
                     *         "interval": "week",
                     *         "intervalCount": 1
                     *       },
                     *       "updateStatus": "pending",
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscription-plans/subscription_plan_Bm7xNvPwKr3YjTgHcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["SubscriptionPlan"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    archiveSubscriptionPlan: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the subscription plan
                 * @example subscription_plan_Wt5mNvBxKw7YcZaEjLhR
                 */
                subscriptionPlanId: components["parameters"]["subscriptionPlanId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Plan archived (or already archived). */
            204: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    unarchiveSubscriptionPlan: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the subscription plan
                 * @example subscription_plan_Wt5mNvBxKw7YcZaEjLhR
                 */
                subscriptionPlanId: components["parameters"]["subscriptionPlanId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The plan, now open to new business again. */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "subscription_plan_Wt5mNvBxKw7YcZaEjLhR",
                     *       "resource": "subscription_plan",
                     *       "testmode": false,
                     *       "name": "Pro Monthly",
                     *       "description": "Full access to all Pro features, billed monthly",
                     *       "basePrice": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxBehavior": "exclusive",
                     *       "interval": "month",
                     *       "intervalCount": 1,
                     *       "productType": "saas",
                     *       "status": "active",
                     *       "archivedAt": null,
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscription-plans/subscription_plan_Wt5mNvBxKw7YcZaEjLhR",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["SubscriptionPlan"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listOrders: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of orders */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "order_Hn5xWqVfKm8RjTgYbUcP",
                     *           "resource": "order",
                     *           "customerId": "customer_Xk9pQrSvWm4NjLhYbUcP",
                     *           "testmode": false,
                     *           "metadata": {},
                     *           "paymentMethod": "ideal",
                     *           "createdAt": "2024-01-15T10:30:00Z",
                     *           "status": "paid",
                     *           "invoiceNumber": "INV-2024-0001",
                     *           "total": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "reversedSubtotal": {
                     *             "value": "0.00",
                     *             "currency": "EUR"
                     *           },
                     *           "refundableSubtotal": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxSummary": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "6.09",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ],
                     *           "lines": [
                     *             {
                     *               "id": "order_item_Mn6xBtPvKw2RjTgYcZaE",
                     *               "resource": "orderline",
                     *               "description": "Pro Monthly Subscription",
                     *               "quantity": 1,
                     *               "basePrice": {
                     *                 "value": "29.00",
                     *                 "currency": "EUR"
                     *               },
                     *               "total": {
                     *                 "value": "35.09",
                     *                 "currency": "EUR"
                     *               },
                     *               "subtotal": {
                     *                 "value": "29.00",
                     *                 "currency": "EUR"
                     *               },
                     *               "taxes": [
                     *                 {
                     *                   "taxRate": {
                     *                     "name": "VAT",
                     *                     "percentage": 21,
                     *                     "taxablePercentage": 100
                     *                   },
                     *                   "amount": {
                     *                     "value": "6.09",
                     *                     "currency": "EUR"
                     *                   }
                     *                 }
                     *               ],
                     *               "productType": "subscription",
                     *               "productId": "subscription_Hn5xWqVfKm8RjTgYbUcP"
                     *             }
                     *           ],
                     *           "customerDetails": {
                     *             "fullName": "John Doe",
                     *             "companyName": "Acme Corp",
                     *             "streetAndNumber": "123 Main Street",
                     *             "city": "Berlin",
                     *             "postalCode": "10115",
                     *             "country": "DE",
                     *             "email": "john@acme.com"
                     *           },
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/orders/order_Hn5xWqVfKm8RjTgYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "customer": {
                     *               "href": "https://api.vatly.com/v1/customers/customer_Xk9pQrSvWm4NjLhYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "customerInvoice": {
                     *               "href": "https://vatly.com/invoices/order_Hn5xWqVfKm8RjTgYbUcP",
                     *               "type": "text/html"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 1,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/orders",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["Order"][];
                        /**
                         * @description Number of items in the current page
                         * @example 1
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Order details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "order_Hn5xWqVfKm8RjTgYbUcP",
                     *       "resource": "order",
                     *       "customerId": "customer_Xk9pQrSvWm4NjLhYbUcP",
                     *       "testmode": false,
                     *       "metadata": {},
                     *       "paymentMethod": "ideal",
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "status": "paid",
                     *       "invoiceNumber": "INV-2024-0001",
                     *       "total": {
                     *         "value": "35.09",
                     *         "currency": "EUR"
                     *       },
                     *       "subtotal": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "reversedSubtotal": {
                     *         "value": "0.00",
                     *         "currency": "EUR"
                     *       },
                     *       "refundableSubtotal": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxSummary": [
                     *         {
                     *           "taxRate": {
                     *             "name": "VAT",
                     *             "percentage": 21,
                     *             "taxablePercentage": 100
                     *           },
                     *           "amount": {
                     *             "value": "6.09",
                     *             "currency": "EUR"
                     *           }
                     *         }
                     *       ],
                     *       "lines": [
                     *         {
                     *           "id": "order_item_Jk4pQrSvWm8NjLhYbUcP",
                     *           "resource": "orderline",
                     *           "description": "Pro Monthly Subscription — initial checkout",
                     *           "quantity": 1,
                     *           "basePrice": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "total": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxes": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "6.09",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ],
                     *           "productType": "subscription_plan",
                     *           "productId": "subscription_plan_Hn5xWqVfKm8RjTgYbUcP",
                     *           "relatedResources": {
                     *             "subscriptionId": "subscription_Hn5xWqVfKm8RjTgYbUcP"
                     *           }
                     *         }
                     *       ],
                     *       "customerDetails": {
                     *         "fullName": "John Doe",
                     *         "companyName": "Acme Corp",
                     *         "streetAndNumber": "123 Main Street",
                     *         "city": "Berlin",
                     *         "postalCode": "10115",
                     *         "country": "DE",
                     *         "email": "john@acme.com"
                     *       },
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Hn5xWqVfKm8RjTgYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "customer": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_Xk9pQrSvWm4NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "customerInvoice": {
                     *           "href": "https://vatly.com/invoices/order_Hn5xWqVfKm8RjTgYbUcP",
                     *           "type": "text/html"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Order"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    createOrderInvoiceUpdateLink: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Invoice update link generated */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "href": "https://vatly.com/invoices/order_Hn5xWqVfKm8RjTgYbUcP/edit?signature=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                     *       "type": "text/html"
                     *     }
                     */
                    "application/json": components["schemas"]["InvoiceUpdateLink"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listOrderRefunds: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of order refunds */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "refund_Bm7xNvPwKr3YjTgHcZaE",
                     *           "resource": "refund",
                     *           "orderId": null,
                     *           "customerId": "customer_Wt5mNvBxKw7YcZaEjLhR",
                     *           "testmode": false,
                     *           "createdAt": "2024-01-20T14:00:00Z",
                     *           "status": "pending",
                     *           "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "total": {
                     *             "value": "12.10",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "10.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxSummary": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "2.10",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ],
                     *           "lines": [
                     *             {
                     *               "id": "refund_item_Jk4pQrSvWm8NjLhYbUcP",
                     *               "resource": "refundline",
                     *               "description": "Partial refund for service issue",
                     *               "quantity": 1,
                     *               "basePrice": {
                     *                 "value": "10.00",
                     *                 "currency": "EUR"
                     *               },
                     *               "total": {
                     *                 "value": "12.10",
                     *                 "currency": "EUR"
                     *               },
                     *               "subtotal": {
                     *                 "value": "10.00",
                     *                 "currency": "EUR"
                     *               },
                     *               "taxes": [
                     *                 {
                     *                   "taxRate": {
                     *                     "name": "VAT",
                     *                     "percentage": 21,
                     *                     "taxablePercentage": 100
                     *                   },
                     *                   "amount": {
                     *                     "value": "2.10",
                     *                     "currency": "EUR"
                     *                   }
                     *                 }
                     *               ]
                     *             }
                     *           ],
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/refunds/refund_Bm7xNvPwKr3YjTgHcZaE",
                     *               "type": "application/json"
                     *             },
                     *             "originalOrder": {
                     *               "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "order": null,
                     *             "customerInvoice": null
                     *           }
                     *         }
                     *       ],
                     *       "count": 1,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP/refunds",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["Refund"][];
                        /**
                         * @description Number of items in the current page
                         * @example 1
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    createOrderRefund: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateRefundRequest"];
            };
        };
        responses: {
            /** @description Refund created successfully */
            201: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "refund_Mn6xBtPvKw2RjTgYcZaE",
                     *       "resource": "refund",
                     *       "orderId": null,
                     *       "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *       "testmode": false,
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "status": "pending",
                     *       "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *       "total": {
                     *         "value": "18.15",
                     *         "currency": "EUR"
                     *       },
                     *       "subtotal": {
                     *         "value": "15.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxSummary": [
                     *         {
                     *           "taxRate": {
                     *             "name": "VAT",
                     *             "percentage": 21,
                     *             "taxablePercentage": 100
                     *           },
                     *           "amount": {
                     *             "value": "3.15",
                     *             "currency": "EUR"
                     *           }
                     *         }
                     *       ],
                     *       "lines": [
                     *         {
                     *           "id": "refund_item_Tk7mNvBxKw2RjTgYcZaE",
                     *           "resource": "refundline",
                     *           "description": "50% refund for service issue",
                     *           "quantity": 1,
                     *           "basePrice": {
                     *             "value": "15.00",
                     *             "currency": "EUR"
                     *           },
                     *           "total": {
                     *             "value": "18.15",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "15.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxes": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "3.15",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ]
                     *         }
                     *       ],
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/refunds/refund_Mn6xBtPvKw2RjTgYcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "originalOrder": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "order": null,
                     *         "customerInvoice": null
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Refund"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            /**
             * @description Validation failed. Common errors:
             *     - Order is not in `paid` status
             *     - Order's payment provider does not support refunds
             *     - Refund amount exceeds remaining refundable amount
             */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationError"];
                };
            };
            default: components["responses"]["UnexpectedError"];
        };
    };
    createFullOrderRefund: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                /**
                 * @example {
                 *       "metadata": {
                 *         "reason": "Customer requested cancellation"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["CreateFullRefundRequest"];
            };
        };
        responses: {
            /** @description Full refund created successfully */
            201: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "refund_Rk5pQrSvWm8NjLhYbUcP",
                     *       "resource": "refund",
                     *       "orderId": null,
                     *       "customerId": "customer_Wt5mNvBxKw7YcZaEjLhR",
                     *       "testmode": false,
                     *       "createdAt": "2024-01-21T09:00:00Z",
                     *       "status": "pending",
                     *       "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *       "total": {
                     *         "value": "35.09",
                     *         "currency": "EUR"
                     *       },
                     *       "subtotal": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxSummary": [
                     *         {
                     *           "taxRate": {
                     *             "name": "VAT",
                     *             "percentage": 21,
                     *             "taxablePercentage": 100
                     *           },
                     *           "amount": {
                     *             "value": "6.09",
                     *             "currency": "EUR"
                     *           }
                     *         }
                     *       ],
                     *       "lines": [
                     *         {
                     *           "id": "refund_item_Bm7xNvPwKr3YjTgHcZaE",
                     *           "resource": "refundline",
                     *           "description": "Pro Monthly Subscription (Full Refund)",
                     *           "quantity": 1,
                     *           "basePrice": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "total": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxes": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "6.09",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ]
                     *         }
                     *       ],
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/refunds/refund_Rk5pQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "originalOrder": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "order": null,
                     *         "customerInvoice": null
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Refund"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getOrderRefund: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
                /**
                 * @description Unique identifier of the refund
                 * @example refund_Xk9pQrSvWm4NjLhYbUcP
                 */
                refundId: components["parameters"]["refundId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Refund details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "refund_Xk9pQrSvWm4NjLhYbUcP",
                     *       "resource": "refund",
                     *       "orderId": "order_Bm7xNvPwKr3YjTgHcZaE",
                     *       "customerId": "customer_Wt5mNvBxKw7YcZaEjLhR",
                     *       "testmode": false,
                     *       "createdAt": "2024-01-20T14:00:00Z",
                     *       "status": "refunded",
                     *       "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *       "total": {
                     *         "value": "18.15",
                     *         "currency": "EUR"
                     *       },
                     *       "subtotal": {
                     *         "value": "15.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxSummary": [
                     *         {
                     *           "taxRate": {
                     *             "name": "VAT",
                     *             "percentage": 21,
                     *             "taxablePercentage": 100
                     *           },
                     *           "amount": {
                     *             "value": "3.15",
                     *             "currency": "EUR"
                     *           }
                     *         }
                     *       ],
                     *       "lines": [
                     *         {
                     *           "id": "refund_item_Mn6xBtPvKw2RjTgYcZaE",
                     *           "resource": "refundline",
                     *           "description": "Pro Monthly Subscription (Refund)",
                     *           "quantity": 1,
                     *           "basePrice": {
                     *             "value": "15.00",
                     *             "currency": "EUR"
                     *           },
                     *           "total": {
                     *             "value": "18.15",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "15.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxes": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "3.15",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ]
                     *         }
                     *       ],
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/refunds/refund_Xk9pQrSvWm4NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "originalOrder": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "order": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Bm7xNvPwKr3YjTgHcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "customerInvoice": {
                     *           "href": "https://vatly.com/invoices/order_Bm7xNvPwKr3YjTgHcZaE",
                     *           "type": "text/html"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Refund"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    cancelOrderRefund: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
                /**
                 * @description Unique identifier of the refund
                 * @example refund_Xk9pQrSvWm4NjLhYbUcP
                 */
                refundId: components["parameters"]["refundId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Refund canceled successfully */
            204: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            /** @description Cannot cancel refund (not in pending status) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "message": "Only pending refunds can be canceled."
                     *     }
                     */
                    "application/json": components["schemas"]["Error"];
                };
            };
            default: components["responses"]["UnexpectedError"];
        };
    };
    listOrderChargebacks: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of order chargebacks */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "chargeback_Fp2kQrSvWm8NjLhYbUcP",
                     *           "resource": "chargeback",
                     *           "testmode": false,
                     *           "createdAt": "2024-01-25T16:45:00Z",
                     *           "amount": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "settlementAmount": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "status": "lost",
                     *           "total": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxSummary": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "6.09",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ],
                     *           "reason": "product_not_received",
                     *           "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "orderId": "order_Rk5pQrSvWm8NjLhYbUcP",
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/chargebacks/chargeback_Fp2kQrSvWm8NjLhYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "originalOrder": {
                     *               "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "order": {
                     *               "href": "https://api.vatly.com/v1/orders/order_Rk5pQrSvWm8NjLhYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "customerInvoice": {
                     *               "href": "https://vatly.com/invoices/order_Rk5pQrSvWm8NjLhYbUcP",
                     *               "type": "text/html"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 1,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP/chargebacks",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["Chargeback"][];
                        /**
                         * @description Number of items in the current page
                         * @example 1
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getOrderChargeback: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
                /**
                 * @description Unique identifier of the chargeback
                 * @example chargeback_Mn6xBtPvKw2RjTgYcZaE
                 */
                chargebackId: components["parameters"]["chargebackId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Chargeback details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "chargeback_Mn6xBtPvKw2RjTgYcZaE",
                     *       "resource": "chargeback",
                     *       "testmode": false,
                     *       "createdAt": "2024-01-25T16:45:00Z",
                     *       "amount": {
                     *         "value": "35.09",
                     *         "currency": "EUR"
                     *       },
                     *       "settlementAmount": {
                     *         "value": "35.09",
                     *         "currency": "EUR"
                     *       },
                     *       "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *       "status": "lost",
                     *       "total": {
                     *         "value": "35.09",
                     *         "currency": "EUR"
                     *       },
                     *       "subtotal": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxSummary": [
                     *         {
                     *           "taxRate": {
                     *             "name": "VAT",
                     *             "percentage": 21,
                     *             "taxablePercentage": 100
                     *           },
                     *           "amount": {
                     *             "value": "6.09",
                     *             "currency": "EUR"
                     *           }
                     *         }
                     *       ],
                     *       "reason": "fraud",
                     *       "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *       "orderId": "order_Rk5pQrSvWm8NjLhYbUcP",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/chargebacks/chargeback_Mn6xBtPvKw2RjTgYcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "originalOrder": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "order": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Rk5pQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "customerInvoice": {
                     *           "href": "https://vatly.com/invoices/order_Rk5pQrSvWm8NjLhYbUcP",
                     *           "type": "text/html"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Chargeback"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listRefunds: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of refunds */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "refund_Xk9pQrSvWm4NjLhYbUcP",
                     *           "resource": "refund",
                     *           "orderId": "order_Bm7xNvPwKr3YjTgHcZaE",
                     *           "customerId": "customer_Wt5mNvBxKw7YcZaEjLhR",
                     *           "testmode": false,
                     *           "createdAt": "2024-01-20T14:00:00Z",
                     *           "status": "refunded",
                     *           "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "total": {
                     *             "value": "18.15",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "15.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxSummary": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "3.15",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ],
                     *           "lines": [
                     *             {
                     *               "id": "refund_item_Mn6xBtPvKw2RjTgYcZaE",
                     *               "resource": "refundline",
                     *               "description": "Pro Monthly Subscription (Refund)",
                     *               "quantity": 1,
                     *               "basePrice": {
                     *                 "value": "15.00",
                     *                 "currency": "EUR"
                     *               },
                     *               "total": {
                     *                 "value": "18.15",
                     *                 "currency": "EUR"
                     *               },
                     *               "subtotal": {
                     *                 "value": "15.00",
                     *                 "currency": "EUR"
                     *               },
                     *               "taxes": [
                     *                 {
                     *                   "taxRate": {
                     *                     "name": "VAT",
                     *                     "percentage": 21,
                     *                     "taxablePercentage": 100
                     *                   },
                     *                   "amount": {
                     *                     "value": "3.15",
                     *                     "currency": "EUR"
                     *                   }
                     *                 }
                     *               ]
                     *             }
                     *           ],
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/refunds/refund_Xk9pQrSvWm4NjLhYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "originalOrder": {
                     *               "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "order": {
                     *               "href": "https://api.vatly.com/v1/orders/order_Bm7xNvPwKr3YjTgHcZaE",
                     *               "type": "application/json"
                     *             },
                     *             "customerInvoice": {
                     *               "href": "https://vatly.com/invoices/order_Bm7xNvPwKr3YjTgHcZaE",
                     *               "type": "text/html"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 1,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/refunds",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["Refund"][];
                        /**
                         * @description Number of items in the current page
                         * @example 1
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getRefund: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the refund
                 * @example refund_Xk9pQrSvWm4NjLhYbUcP
                 */
                refundId: components["parameters"]["refundId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Refund details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "refund_Xk9pQrSvWm4NjLhYbUcP",
                     *       "resource": "refund",
                     *       "orderId": "order_Bm7xNvPwKr3YjTgHcZaE",
                     *       "customerId": "customer_Wt5mNvBxKw7YcZaEjLhR",
                     *       "testmode": false,
                     *       "createdAt": "2024-01-20T14:00:00Z",
                     *       "status": "refunded",
                     *       "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *       "total": {
                     *         "value": "18.15",
                     *         "currency": "EUR"
                     *       },
                     *       "subtotal": {
                     *         "value": "15.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxSummary": [
                     *         {
                     *           "taxRate": {
                     *             "name": "VAT",
                     *             "percentage": 21,
                     *             "taxablePercentage": 100
                     *           },
                     *           "amount": {
                     *             "value": "3.15",
                     *             "currency": "EUR"
                     *           }
                     *         }
                     *       ],
                     *       "lines": [
                     *         {
                     *           "id": "refund_item_Mn6xBtPvKw2RjTgYcZaE",
                     *           "resource": "refundline",
                     *           "description": "Pro Monthly Subscription (Refund)",
                     *           "quantity": 1,
                     *           "basePrice": {
                     *             "value": "15.00",
                     *             "currency": "EUR"
                     *           },
                     *           "total": {
                     *             "value": "18.15",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "15.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxes": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "3.15",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ]
                     *         }
                     *       ],
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/refunds/refund_Xk9pQrSvWm4NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "originalOrder": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "order": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Bm7xNvPwKr3YjTgHcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "customerInvoice": {
                     *           "href": "https://vatly.com/invoices/order_Bm7xNvPwKr3YjTgHcZaE",
                     *           "type": "text/html"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Refund"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listChargebacks: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of chargebacks */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "chargeback_Mn6xBtPvKw2RjTgYcZaE",
                     *           "resource": "chargeback",
                     *           "testmode": false,
                     *           "createdAt": "2024-01-15T10:30:00Z",
                     *           "amount": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "settlementAmount": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "status": "lost",
                     *           "total": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxSummary": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "6.09",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ],
                     *           "reason": "fraud",
                     *           "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "orderId": "order_Rk5pQrSvWm8NjLhYbUcP",
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/chargebacks/chargeback_Mn6xBtPvKw2RjTgYcZaE",
                     *               "type": "application/json"
                     *             },
                     *             "originalOrder": {
                     *               "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "order": {
                     *               "href": "https://api.vatly.com/v1/orders/order_Rk5pQrSvWm8NjLhYbUcP",
                     *               "type": "application/json"
                     *             },
                     *             "customerInvoice": {
                     *               "href": "https://vatly.com/invoices/order_Rk5pQrSvWm8NjLhYbUcP",
                     *               "type": "text/html"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 1,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/chargebacks",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["Chargeback"][];
                        /**
                         * @description Number of items in the current page
                         * @example 1
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getChargeback: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the chargeback
                 * @example chargeback_Mn6xBtPvKw2RjTgYcZaE
                 */
                chargebackId: components["parameters"]["chargebackId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Chargeback details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "chargeback_Mn6xBtPvKw2RjTgYcZaE",
                     *       "resource": "chargeback",
                     *       "testmode": false,
                     *       "createdAt": "2024-01-25T16:45:00Z",
                     *       "amount": {
                     *         "value": "35.09",
                     *         "currency": "EUR"
                     *       },
                     *       "settlementAmount": {
                     *         "value": "35.09",
                     *         "currency": "EUR"
                     *       },
                     *       "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *       "status": "lost",
                     *       "total": {
                     *         "value": "35.09",
                     *         "currency": "EUR"
                     *       },
                     *       "subtotal": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxSummary": [
                     *         {
                     *           "taxRate": {
                     *             "name": "VAT",
                     *             "percentage": 21,
                     *             "taxablePercentage": 100
                     *           },
                     *           "amount": {
                     *             "value": "6.09",
                     *             "currency": "EUR"
                     *           }
                     *         }
                     *       ],
                     *       "reason": "fraud",
                     *       "originalOrderId": "order_Fp2kQrSvWm8NjLhYbUcP",
                     *       "orderId": "order_Rk5pQrSvWm8NjLhYbUcP",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/chargebacks/chargeback_Mn6xBtPvKw2RjTgYcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "originalOrder": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Fp2kQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "order": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Rk5pQrSvWm8NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "customerInvoice": {
                     *           "href": "https://vatly.com/invoices/order_Rk5pQrSvWm8NjLhYbUcP",
                     *           "type": "text/html"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Chargeback"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getWebhookEvent: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the webhook event
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                eventId: components["parameters"]["eventId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Webhook event details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "webhook_event_Qk8pRtSvWm2NjLhYcZaE",
                     *       "resource": "webhook_event",
                     *       "eventName": "order.paid",
                     *       "reason": null,
                     *       "entityType": "order",
                     *       "entityId": "order_Hn5xWqVfKm8RjTgYbUcP",
                     *       "object": {
                     *         "id": "order_Hn5xWqVfKm8RjTgYbUcP",
                     *         "resource": "order",
                     *         "customerId": "customer_Xk9pQrSvWm4NjLhYbUcP",
                     *         "testmode": false,
                     *         "metadata": {},
                     *         "paymentMethod": "ideal",
                     *         "createdAt": "2026-05-21T14:32:08+00:00",
                     *         "status": "paid",
                     *         "invoiceNumber": "INV-2026-0001",
                     *         "total": {
                     *           "value": "29.99",
                     *           "currency": "EUR"
                     *         },
                     *         "subtotal": {
                     *           "value": "24.79",
                     *           "currency": "EUR"
                     *         },
                     *         "reversedSubtotal": {
                     *           "value": "0.00",
                     *           "currency": "EUR"
                     *         },
                     *         "refundableSubtotal": {
                     *           "value": "24.79",
                     *           "currency": "EUR"
                     *         },
                     *         "taxSummary": [
                     *           {
                     *             "taxRate": {
                     *               "name": "VAT",
                     *               "percentage": 21,
                     *               "taxablePercentage": 100
                     *             },
                     *             "amount": {
                     *               "value": "5.20",
                     *               "currency": "EUR"
                     *             }
                     *           }
                     *         ],
                     *         "lines": [
                     *           {
                     *             "id": "order_item_Mn6xBtPvKw2RjTgYcZaE",
                     *             "resource": "orderline",
                     *             "description": "Pro Monthly Subscription",
                     *             "quantity": 1,
                     *             "basePrice": {
                     *               "value": "24.79",
                     *               "currency": "EUR"
                     *             },
                     *             "total": {
                     *               "value": "29.99",
                     *               "currency": "EUR"
                     *             },
                     *             "subtotal": {
                     *               "value": "24.79",
                     *               "currency": "EUR"
                     *             },
                     *             "taxes": [
                     *               {
                     *                 "taxRate": {
                     *                   "name": "VAT",
                     *                   "percentage": 21,
                     *                   "taxablePercentage": 100
                     *                 },
                     *                 "amount": {
                     *                   "value": "5.20",
                     *                   "currency": "EUR"
                     *                 }
                     *               }
                     *             ],
                     *             "productType": "subscription",
                     *             "productId": "subscription_Hn5xWqVfKm8RjTgYbUcP"
                     *           }
                     *         ],
                     *         "customerDetails": {
                     *           "fullName": "John Doe",
                     *           "companyName": "Acme Corp",
                     *           "streetAndNumber": "123 Main Street",
                     *           "city": "Berlin",
                     *           "postalCode": "10115",
                     *           "country": "DE",
                     *           "email": "john@acme.com"
                     *         },
                     *         "links": {
                     *           "self": {
                     *             "href": "https://api.vatly.com/v1/orders/order_Hn5xWqVfKm8RjTgYbUcP",
                     *             "type": "application/json"
                     *           },
                     *           "customer": {
                     *             "href": "https://api.vatly.com/v1/customers/customer_Xk9pQrSvWm4NjLhYbUcP",
                     *             "type": "application/json"
                     *           },
                     *           "customerInvoice": {
                     *             "href": "https://vatly.com/invoices/order_Hn5xWqVfKm8RjTgYbUcP",
                     *             "type": "text/html"
                     *           }
                     *         }
                     *       },
                     *       "createdAt": "2026-05-21T14:32:08+00:00",
                     *       "testmode": false,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/webhook-events/webhook_event_Qk8pRtSvWm2NjLhYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["WebhookEvent"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listWebhookEndpoints: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of webhook endpoints */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "webhook_QdEpFhdSrG4Y3DnfsdqsH",
                     *           "resource": "webhook_endpoint",
                     *           "testmode": false,
                     *           "url": "https://merchant.example/webhooks/vatly",
                     *           "enabledEvents": [
                     *             "order.paid",
                     *             "refund.completed"
                     *           ],
                     *           "createdAt": "2024-01-15T10:30:00Z",
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/webhook-endpoints/webhook_QdEpFhdSrG4Y3DnfsdqsH",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         },
                     *         {
                     *           "id": "webhook_Vm6zTjNsKp9LcRwXyBaF",
                     *           "resource": "webhook_endpoint",
                     *           "testmode": false,
                     *           "url": "https://analytics.example/webhooks/vatly",
                     *           "enabledEvents": [
                     *             "checkout.paid"
                     *           ],
                     *           "createdAt": "2024-02-10T08:15:00Z",
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/webhook-endpoints/webhook_Vm6zTjNsKp9LcRwXyBaF",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 2,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/webhook-endpoints",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["WebhookEndpoint"][];
                        /**
                         * @description Number of items in the current page
                         * @example 2
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    createWebhookEndpoint: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "url": "https://merchant.example/webhooks/vatly",
                 *       "secret": "whsec_3f9a1c7e2d4f7b9c5a2c1d5b7e9f3a8d",
                 *       "enabledEvents": [
                 *         "order.paid",
                 *         "refund.completed"
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["CreateWebhookEndpointRequest"];
            };
        };
        responses: {
            /** @description Webhook endpoint registered successfully */
            201: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "webhook_QdEpFhdSrG4Y3DnfsdqsH",
                     *       "resource": "webhook_endpoint",
                     *       "testmode": false,
                     *       "url": "https://merchant.example/webhooks/vatly",
                     *       "enabledEvents": [
                     *         "order.paid",
                     *         "refund.completed"
                     *       ],
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/webhook-endpoints/webhook_QdEpFhdSrG4Y3DnfsdqsH",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["WebhookEndpoint"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getWebhookEndpoint: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the webhook endpoint
                 * @example webhook_QdEpFhdSrG4Y3DnfsdqsH
                 */
                webhookEndpointId: components["parameters"]["webhookEndpointId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Webhook endpoint details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "webhook_QdEpFhdSrG4Y3DnfsdqsH",
                     *       "resource": "webhook_endpoint",
                     *       "testmode": false,
                     *       "url": "https://merchant.example/webhooks/vatly",
                     *       "enabledEvents": [
                     *         "order.paid",
                     *         "refund.completed"
                     *       ],
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/webhook-endpoints/webhook_QdEpFhdSrG4Y3DnfsdqsH",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["WebhookEndpoint"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    deleteWebhookEndpoint: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the webhook endpoint
                 * @example webhook_QdEpFhdSrG4Y3DnfsdqsH
                 */
                webhookEndpointId: components["parameters"]["webhookEndpointId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Webhook endpoint deleted successfully */
            204: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    updateWebhookEndpoint: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the webhook endpoint
                 * @example webhook_QdEpFhdSrG4Y3DnfsdqsH
                 */
                webhookEndpointId: components["parameters"]["webhookEndpointId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "url": "https://merchant.example/webhooks/vatly-v2",
                 *       "enabledEvents": [
                 *         "checkout.paid",
                 *         "order.paid"
                 *       ]
                 *     }
                 */
                "application/json": components["schemas"]["UpdateWebhookEndpointRequest"];
            };
        };
        responses: {
            /** @description Webhook endpoint updated successfully */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "webhook_QdEpFhdSrG4Y3DnfsdqsH",
                     *       "resource": "webhook_endpoint",
                     *       "testmode": false,
                     *       "url": "https://merchant.example/webhooks/vatly-v2",
                     *       "enabledEvents": [
                     *         "checkout.paid",
                     *         "order.paid"
                     *       ],
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/webhook-endpoints/webhook_QdEpFhdSrG4Y3DnfsdqsH",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["WebhookEndpoint"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    listSubscriptions: {
        parameters: {
            query?: {
                /**
                 * @description Maximum number of results to return per page
                 * @example 25
                 */
                limit?: components["parameters"]["limit"];
                /**
                 * @description Cursor for forward pagination.
                 *     Returns results after this resource ID.
                 *     Mutually exclusive with `endingBefore`.
                 * @example checkout_QdEpFhdSrG4Y3DnfsdqsH
                 */
                startingAfter?: components["parameters"]["startingAfter"];
                /**
                 * @description Cursor for backward pagination.
                 *     Returns results before this resource ID.
                 *     Mutually exclusive with `startingAfter`.
                 * @example checkout_Rk5pQrSvWm8NjLhYbUcP
                 */
                endingBefore?: components["parameters"]["endingBefore"];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description List of subscriptions */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "data": [
                     *         {
                     *           "id": "subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *           "resource": "subscription",
                     *           "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "subscriptionPlanId": "subscription_plan_Rk5pQrSvWm8NjLhYbUcP",
                     *           "testmode": false,
                     *           "name": "Pro Monthly",
                     *           "description": "Full access to all Pro features",
                     *           "billingAddress": {
                     *             "fullName": "John Doe",
                     *             "companyName": "Acme Corp",
                     *             "streetAndNumber": "123 Main Street",
                     *             "city": "Berlin",
                     *             "postalCode": "10115",
                     *             "country": "DE"
                     *           },
                     *           "basePrice": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "quantity": 1,
                     *           "interval": "month",
                     *           "intervalCount": 1,
                     *           "status": "active",
                     *           "cancellationReason": null,
                     *           "mandate": {
                     *             "method": "card",
                     *             "maskedIdentifier": "4242"
                     *           },
                     *           "startedAt": "2024-01-15T10:30:00Z",
                     *           "endedAt": null,
                     *           "canceledAt": null,
                     *           "renewedAt": "2024-02-15T10:30:00Z",
                     *           "renewedUntil": "2024-03-15T10:30:00Z",
                     *           "nextRenewalAt": "2024-03-15T10:30:00Z",
                     *           "trialUntil": null,
                     *           "scheduledUpdate": null,
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/subscriptions/subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *               "type": "application/json"
                     *             },
                     *             "customer": {
                     *               "href": "https://api.vatly.com/v1/customers/customer_Lp3mNvBxKw7RjTgYcZaE",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         },
                     *         {
                     *           "id": "subscription_Wt5mNvBxKw7YcZaEjLhR",
                     *           "resource": "subscription",
                     *           "customerId": "customer_Mn6xBtPvKw2RjTgYcZaE",
                     *           "subscriptionPlanId": "subscription_plan_Wt5mNvBxKw7YcZaEjLhR",
                     *           "testmode": false,
                     *           "name": "Enterprise Yearly",
                     *           "description": "Enterprise features with priority support",
                     *           "billingAddress": {
                     *             "fullName": "Jane Smith",
                     *             "companyName": "TechCorp Ltd",
                     *             "taxId": "GB123456789",
                     *             "streetAndNumber": "456 Tech Lane",
                     *             "city": "London",
                     *             "postalCode": "EC1A 1BB",
                     *             "country": "GB"
                     *           },
                     *           "basePrice": {
                     *             "value": "990.00",
                     *             "currency": "EUR"
                     *           },
                     *           "quantity": 5,
                     *           "interval": "year",
                     *           "intervalCount": 1,
                     *           "status": "active",
                     *           "cancellationReason": null,
                     *           "mandate": {
                     *             "method": "card",
                     *             "maskedIdentifier": "4242"
                     *           },
                     *           "startedAt": "2024-01-01T00:00:00Z",
                     *           "endedAt": null,
                     *           "canceledAt": null,
                     *           "renewedAt": "2024-01-01T00:00:00Z",
                     *           "renewedUntil": "2025-01-01T00:00:00Z",
                     *           "nextRenewalAt": "2025-01-01T00:00:00Z",
                     *           "trialUntil": null,
                     *           "scheduledUpdate": null,
                     *           "links": {
                     *             "self": {
                     *               "href": "https://api.vatly.com/v1/subscriptions/subscription_Wt5mNvBxKw7YcZaEjLhR",
                     *               "type": "application/json"
                     *             },
                     *             "customer": {
                     *               "href": "https://api.vatly.com/v1/customers/customer_Mn6xBtPvKw2RjTgYcZaE",
                     *               "type": "application/json"
                     *             }
                     *           }
                     *         }
                     *       ],
                     *       "count": 2,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscriptions",
                     *           "type": "application/json"
                     *         },
                     *         "next": null,
                     *         "prev": null
                     *       }
                     *     }
                     */
                    "application/json": {
                        data: components["schemas"]["Subscription"][];
                        /**
                         * @description Number of items in the current page
                         * @example 2
                         */
                        count: number;
                        links: components["schemas"]["PaginationLinks"];
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    getSubscription: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /**
                 * @description Unique identifier of the subscription
                 * @example subscription_Lp3mNvBxKw7RjTgYcZaE
                 */
                subscriptionId: components["parameters"]["subscriptionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Subscription details */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *       "resource": "subscription",
                     *       "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *       "subscriptionPlanId": "subscription_plan_Rk5pQrSvWm8NjLhYbUcP",
                     *       "testmode": false,
                     *       "name": "Pro Monthly",
                     *       "description": "Full access to all Pro features",
                     *       "billingAddress": {
                     *         "fullName": "John Doe",
                     *         "companyName": "Acme Corp",
                     *         "streetAndNumber": "123 Main Street",
                     *         "city": "Berlin",
                     *         "postalCode": "10115",
                     *         "country": "DE"
                     *       },
                     *       "basePrice": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "quantity": 1,
                     *       "interval": "month",
                     *       "intervalCount": 1,
                     *       "status": "active",
                     *       "cancellationReason": null,
                     *       "mandate": {
                     *         "method": "card",
                     *         "maskedIdentifier": "4242"
                     *       },
                     *       "startedAt": "2024-01-15T10:30:00Z",
                     *       "endedAt": null,
                     *       "canceledAt": null,
                     *       "renewedAt": "2024-02-15T10:30:00Z",
                     *       "renewedUntil": "2024-03-15T10:30:00Z",
                     *       "nextRenewalAt": "2024-03-15T10:30:00Z",
                     *       "trialUntil": null,
                     *       "scheduledUpdate": null,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscriptions/subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "customer": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Subscription"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    cancelSubscription: {
        parameters: {
            query?: {
                /**
                 * @description Cancel immediately instead of at period end.
                 *     - `false` (default): Cancel at end of current billing period
                 *     - `true`: Cancel immediately
                 */
                immediately?: boolean;
            };
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the subscription
                 * @example subscription_Lp3mNvBxKw7RjTgYcZaE
                 */
                subscriptionId: components["parameters"]["subscriptionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Subscription canceled successfully */
            204: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            /** @description Subscription cannot be canceled (already canceled or ended) */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
            default: components["responses"]["UnexpectedError"];
        };
    };
    updateSubscription: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the subscription
                 * @example subscription_Lp3mNvBxKw7RjTgYcZaE
                 */
                subscriptionId: components["parameters"]["subscriptionId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateSubscriptionRequest"];
            };
        };
        responses: {
            /** @description Subscription updated successfully */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *       "resource": "subscription",
                     *       "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *       "subscriptionPlanId": "subscription_plan_Wt5mNvBxKw7YcZaEjLhR",
                     *       "testmode": false,
                     *       "name": "Pro Yearly",
                     *       "description": "Full access to all Pro features, billed yearly",
                     *       "billingAddress": {
                     *         "fullName": "John Doe",
                     *         "companyName": "Acme Corp",
                     *         "streetAndNumber": "123 Main Street",
                     *         "city": "Berlin",
                     *         "postalCode": "10115",
                     *         "country": "DE"
                     *       },
                     *       "basePrice": {
                     *         "value": "290.00",
                     *         "currency": "EUR"
                     *       },
                     *       "quantity": 1,
                     *       "interval": "year",
                     *       "intervalCount": 1,
                     *       "status": "active",
                     *       "cancellationReason": null,
                     *       "mandate": {
                     *         "method": "card",
                     *         "maskedIdentifier": "4242"
                     *       },
                     *       "startedAt": "2024-01-15T10:30:00Z",
                     *       "endedAt": null,
                     *       "canceledAt": null,
                     *       "renewedAt": "2024-02-15T10:30:00Z",
                     *       "renewedUntil": "2025-02-15T10:30:00Z",
                     *       "nextRenewalAt": "2025-02-15T10:30:00Z",
                     *       "trialUntil": null,
                     *       "scheduledUpdate": null,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscriptions/subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "customer": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Subscription"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            /**
             * @description Validation failed. Common errors:
             *     - None of subscriptionPlanId, quantity or price provided
             *     - Plan does not exist or is in wrong testmode
             *     - Price currency does not match the subscription currency
             *     - Both anchor and resetAnchor specified
             *     - Update scheduled for the next cycle of a subscription that is on its
             *       cancellation grace period
             *     - Anchor, resetAnchor or interval change on a subscription that is on
             *       its cancellation grace period
             *     - Immediate prorated update whose charge would be negative. When the
             *       update keeps the billing anchor this is any downgrade, price
             *       decrease or seat reduction while time is left on the cycle.
             *       Schedule it for the next renewal (`applyImmediately: false`)
             *       instead
             */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationError"];
                };
            };
            default: components["responses"]["UnexpectedError"];
        };
    };
    createSubscriptionBillingUpdateLink: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the subscription
                 * @example subscription_Lp3mNvBxKw7RjTgYcZaE
                 */
                subscriptionId: components["parameters"]["subscriptionId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                /**
                 * @example {
                 *       "redirectUrlSuccess": "https://example.com/billing-updated",
                 *       "redirectUrlCanceled": "https://example.com/account/billing",
                 *       "billingAddress": {
                 *         "fullName": "Jane Doe",
                 *         "companyName": "Acme Corp",
                 *         "taxId": "DE123456789",
                 *         "streetAndNumber": "Friedrichstrasse 1",
                 *         "city": "Berlin",
                 *         "postalCode": "10117",
                 *         "country": "DE"
                 *       }
                 *     }
                 */
                "application/json": components["schemas"]["UpdateSubscriptionBillingRequest"];
            };
        };
        responses: {
            /** @description Billing update link generated */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /**
                         * Format: uri
                         * @description URL to redirect customer for billing update
                         * @example https://vatly.com/subscriptions/subscription_Lp3mNvBxKw7RjTgYcZaE/billing?token=xyz...
                         */
                        href: string;
                        /**
                         * @example text/html
                         * @constant
                         */
                        type: "text/html";
                    };
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    resumeSubscription: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the subscription
                 * @example subscription_Lp3mNvBxKw7RjTgYcZaE
                 */
                subscriptionId: components["parameters"]["subscriptionId"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Subscription resumed successfully */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *       "resource": "subscription",
                     *       "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *       "subscriptionPlanId": "subscription_plan_Rk5pQrSvWm8NjLhYbUcP",
                     *       "testmode": false,
                     *       "name": "Pro Monthly",
                     *       "description": "Full access to all Pro features",
                     *       "billingAddress": {
                     *         "fullName": "John Doe",
                     *         "companyName": "Acme Corp",
                     *         "streetAndNumber": "123 Main Street",
                     *         "city": "Berlin",
                     *         "postalCode": "10115",
                     *         "country": "DE"
                     *       },
                     *       "basePrice": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "quantity": 1,
                     *       "interval": "month",
                     *       "intervalCount": 1,
                     *       "status": "active",
                     *       "cancellationReason": null,
                     *       "mandate": {
                     *         "method": "card",
                     *         "maskedIdentifier": "4242"
                     *       },
                     *       "startedAt": "2024-01-15T10:30:00Z",
                     *       "endedAt": null,
                     *       "canceledAt": null,
                     *       "renewedAt": "2024-02-15T10:30:00Z",
                     *       "renewedUntil": "2024-03-15T10:30:00Z",
                     *       "nextRenewalAt": "2024-03-15T10:30:00Z",
                     *       "trialUntil": null,
                     *       "scheduledUpdate": null,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscriptions/subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "customer": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Subscription"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            /**
             * @description Subscription is not within an active grace period. Common causes:
             *     - Subscription was canceled immediately (status `canceled`)
             *     - Grace period has already lapsed (`status` is now `canceled`)
             *     - Subscription is already active (was not canceled, or already resumed)
             */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ValidationError"];
                };
            };
            default: components["responses"]["UnexpectedError"];
        };
    };
    fastForwardSubscriptionRenewal: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the subscription
                 * @example subscription_Lp3mNvBxKw7RjTgYcZaE
                 */
                subscriptionId: components["parameters"]["subscriptionId"];
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["FastForwardSubscriptionRenewalRequest"];
            };
        };
        responses: {
            /** @description Fast-forward accepted; the renewal runs from the queue shortly after */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *       "resource": "subscription",
                     *       "customerId": "customer_Lp3mNvBxKw7RjTgYcZaE",
                     *       "subscriptionPlanId": "subscription_plan_Rk5pQrSvWm8NjLhYbUcP",
                     *       "testmode": true,
                     *       "name": "Pro Monthly",
                     *       "description": "Full access to all Pro features",
                     *       "billingAddress": {
                     *         "fullName": "John Doe",
                     *         "companyName": "Acme Corp",
                     *         "streetAndNumber": "123 Main Street",
                     *         "city": "Berlin",
                     *         "postalCode": "10115",
                     *         "country": "DE"
                     *       },
                     *       "basePrice": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "quantity": 1,
                     *       "interval": "month",
                     *       "intervalCount": 1,
                     *       "status": "active",
                     *       "cancellationReason": null,
                     *       "mandate": {
                     *         "method": "card",
                     *         "maskedIdentifier": "4242"
                     *       },
                     *       "startedAt": "2024-01-15T10:30:00Z",
                     *       "endedAt": null,
                     *       "canceledAt": null,
                     *       "renewedAt": null,
                     *       "renewedUntil": null,
                     *       "nextRenewalAt": "2024-02-15T10:30:00Z",
                     *       "trialUntil": null,
                     *       "scheduledUpdate": null,
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/subscriptions/subscription_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         },
                     *         "customer": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_Lp3mNvBxKw7RjTgYcZaE",
                     *           "type": "application/json"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Subscription"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    simulateOrderPayment: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description A unique key the client generates per logical mutating operation to
                 *     make retries safe. Vatly stores the first response keyed by
                 *     `(token, endpoint, key)` and returns it verbatim on subsequent
                 *     requests with the same key, setting `Idempotent-Replayed: true` on
                 *     the replayed response.
                 *
                 *     Keys bind to the HTTP method, public endpoint, concrete path, query,
                 *     request body, normalized `Content-Type` media type, and normalized
                 *     ordered `Content-Encoding`. Media type and content encoding are
                 *     contract-significant: changing either on a replay returns `409 Conflict`
                 *     without executing the operation again. Keys are scoped per public route
                 *     URI template and retained for 24 hours; internal route-name changes do
                 *     not affect replay identity.
                 *
                 *     Recommended format: UUIDv4. Send on every mutating request
                 *     (POST, PATCH, PUT, DELETE) where retry safety matters.
                 * @example 9f6a3b1c-7e2d-4f7b-9c5a-2c1d5b7e9f3a
                 */
                "Idempotency-Key"?: components["parameters"]["idempotencyKey"];
            };
            path: {
                /**
                 * @description Unique identifier of the order
                 * @example order_Hn5xWqVfKm8RjTgYbUcP
                 */
                orderId: components["parameters"]["orderId"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SimulateOrderPaymentRequest"];
            };
        };
        responses: {
            /** @description Simulation accepted; the outcome is applied from the queue shortly after */
            200: {
                headers: {
                    "Idempotent-Replayed": components["headers"]["IdempotentReplayed"];
                    [name: string]: unknown;
                };
                content: {
                    /**
                     * @example {
                     *       "id": "order_Hn5xWqVfKm8RjTgYbUcP",
                     *       "resource": "order",
                     *       "customerId": "customer_Xk9pQrSvWm4NjLhYbUcP",
                     *       "testmode": true,
                     *       "metadata": {},
                     *       "paymentMethod": null,
                     *       "createdAt": "2024-01-15T10:30:00Z",
                     *       "status": "pending",
                     *       "invoiceNumber": null,
                     *       "total": {
                     *         "value": "35.09",
                     *         "currency": "EUR"
                     *       },
                     *       "subtotal": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "reversedSubtotal": {
                     *         "value": "0.00",
                     *         "currency": "EUR"
                     *       },
                     *       "refundableSubtotal": {
                     *         "value": "29.00",
                     *         "currency": "EUR"
                     *       },
                     *       "taxSummary": [
                     *         {
                     *           "taxRate": {
                     *             "name": "VAT",
                     *             "percentage": 21,
                     *             "taxablePercentage": 100
                     *           },
                     *           "amount": {
                     *             "value": "6.09",
                     *             "currency": "EUR"
                     *           }
                     *         }
                     *       ],
                     *       "lines": [
                     *         {
                     *           "id": "order_item_Jk4pQrSvWm8NjLhYbUcP",
                     *           "resource": "orderline",
                     *           "description": "Pro Monthly Subscription",
                     *           "quantity": 1,
                     *           "basePrice": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "total": {
                     *             "value": "35.09",
                     *             "currency": "EUR"
                     *           },
                     *           "subtotal": {
                     *             "value": "29.00",
                     *             "currency": "EUR"
                     *           },
                     *           "taxes": [
                     *             {
                     *               "taxRate": {
                     *                 "name": "VAT",
                     *                 "percentage": 21,
                     *                 "taxablePercentage": 100
                     *               },
                     *               "amount": {
                     *                 "value": "6.09",
                     *                 "currency": "EUR"
                     *               }
                     *             }
                     *           ],
                     *           "productType": "subscription",
                     *           "productId": "subscription_Hn5xWqVfKm8RjTgYbUcP"
                     *         }
                     *       ],
                     *       "customerDetails": {
                     *         "fullName": "John Doe",
                     *         "companyName": "Acme Corp",
                     *         "streetAndNumber": "123 Main Street",
                     *         "city": "Berlin",
                     *         "postalCode": "10115",
                     *         "country": "DE",
                     *         "email": "john@acme.com"
                     *       },
                     *       "links": {
                     *         "self": {
                     *           "href": "https://api.vatly.com/v1/orders/order_Hn5xWqVfKm8RjTgYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "customer": {
                     *           "href": "https://api.vatly.com/v1/customers/customer_Xk9pQrSvWm4NjLhYbUcP",
                     *           "type": "application/json"
                     *         },
                     *         "customerInvoice": {
                     *           "href": "https://vatly.com/invoices/order_Hn5xWqVfKm8RjTgYbUcP",
                     *           "type": "text/html"
                     *         }
                     *       }
                     *     }
                     */
                    "application/json": components["schemas"]["Order"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            422: components["responses"]["ValidationFailed"];
            default: components["responses"]["UnexpectedError"];
        };
    };
    onOrderPaid: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onOrderCanceled: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onOrderChargebackReceived: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onOrderChargebackReversed: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onOrderPaymentFailed: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onRefundCompleted: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onRefundFailed: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onRefundCanceled: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionStarted: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionCanceledImmediately: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionCanceledForNonpayment: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionCanceledWithGracePeriod: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionCancellationGracePeriodCompleted: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionResumed: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionBillingUpdated: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionUpdated: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionUpdateScheduled: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onCheckoutPaid: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onCheckoutFailed: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onCheckoutCanceled: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onCheckoutExpired: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onWebhookSetup: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["SetupAcknowledged"];
        };
    };
    onOneOffProductUpdateSubmitted: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onOneOffProductUpdateApproved: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onOneOffProductUpdateRejected: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onOneOffProductArchived: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onOneOffProductUnarchived: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionPlanUpdateSubmitted: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionPlanUpdateApproved: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionPlanUpdateRejected: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionPlanArchived: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
    onSubscriptionPlanUnarchived: {
        parameters: {
            query?: never;
            header: {
                /**
                 * @description HMAC-SHA256 signature of the raw request body, formatted `t=<unix-timestamp>,v1=<hex>`.
                 *     Recompute it over the exact bytes received and compare before trusting the payload.
                 *     A fresh signature is sent on every delivery attempt (initial and retries).
                 * @example t=1716301928,v1=5f3cbe2a9d1e4c7b8a0f6d2e1c3b4a5968778695a4b3c2d1e0f9a8b7c6d5e4f3a
                 */
                "Vatly-Signature": components["parameters"]["VatlySignature"];
                /**
                 * @description Stable identifier for this event, constant across delivery retries. Use it as an
                 *     idempotency / dedup key so a retried delivery is not processed twice.
                 * @example webhook_event_Qk8pRtSvWm2NjLhYcZaE
                 */
                "Vatly-Event-Id": components["parameters"]["VatlyEventId"];
            };
            path?: never;
            cookie?: never;
        };
        requestBody: components["requestBodies"]["WebhookDelivery"];
        responses: {
            "2XX": components["responses"]["Acknowledged"];
        };
    };
}

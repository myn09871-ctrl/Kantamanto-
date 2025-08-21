
-- Fix RLS policies for cart_items table
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own cart items
CREATE POLICY "Users can view own cart items" ON public.cart_items
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own cart items
CREATE POLICY "Users can insert own cart items" ON public.cart_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own cart items
CREATE POLICY "Users can update own cart items" ON public.cart_items
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own cart items
CREATE POLICY "Users can delete own cart items" ON public.cart_items
FOR DELETE
USING (auth.uid() = user_id);

-- Fix orders table RLS policies (remove infinite recursion)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

-- Create proper RLS policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert own orders" ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Fix order_items table RLS policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items" ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can insert order items" ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- Fix mobile_money_payments table RLS policies
ALTER TABLE public.mobile_money_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.mobile_money_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = mobile_money_payments.order_id 
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Users can insert payments" ON public.mobile_money_payments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = mobile_money_payments.order_id 
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Service can update payments" ON public.mobile_money_payments
FOR UPDATE
USING (true);

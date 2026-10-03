export interface RestockRequest {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  size?: string;
  color?: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  status: 'pending' | 'notified' | 'cancelled';
  notifiedAt?: string;
  adminNote?: string;
}

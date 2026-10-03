import type { RestockRequest } from '../types/restock';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'atelier_restock_requests_v1';
const EVENT_NAME = 'zarb_restock_requests_updated';

// Read all requests from persistent storage
export function getLocalRestockRequests(): RestockRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read restock requests from localStorage:', err);
    return [];
  }
}

// Save all requests to persistent storage & broadcast event
function saveLocalRestockRequests(requests: RestockRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: requests }));
  } catch (err) {
    console.error('Failed to save restock requests to localStorage:', err);
  }
}

// Check if a specific user already requested a restock notification for a product & size
export function hasUserRequestedRestock(productId: string, userId: string, size?: string): boolean {
  if (!productId || !userId) return false;
  const requests = getLocalRestockRequests();
  return requests.some(r => 
    r.productId === productId && 
    r.userId === userId && 
    (size ? r.size === size : true) &&
    r.status === 'pending'
  );
}

// Add a restock notification request
export async function addRestockRequest(
  data: Omit<RestockRequest, 'id' | 'createdAt' | 'status'>
): Promise<RestockRequest> {
  const newRequest: RestockRequest = {
    ...data,
    id: `restock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  const existing = getLocalRestockRequests();
  // Filter out any older pending duplicate from this user for this product+size
  const filtered = existing.filter(r => 
    !(r.productId === newRequest.productId && r.userId === newRequest.userId && r.size === newRequest.size)
  );
  
  const updated = [newRequest, ...filtered];
  saveLocalRestockRequests(updated);

  // Attempt Supabase sync in the background (non-blocking if table doesn't exist)
  if (isSupabaseConfigured()) {
    try {
      await (supabase as any)
        .from('restock_requests')
        .insert({
          id: newRequest.id,
          product_id: newRequest.productId,
          product_name: newRequest.productName,
          product_image: newRequest.productImage,
          product_price: newRequest.productPrice,
          size: newRequest.size || null,
          color: newRequest.color || null,
          user_id: newRequest.userId,
          customer_name: newRequest.customerName,
          customer_email: newRequest.customerEmail,
          customer_phone: newRequest.customerPhone || null,
          created_at: newRequest.createdAt,
          status: newRequest.status,
        });
    } catch {
      // Supabase table might not exist yet; local sync guarantees functionality
    }
  }

  return newRequest;
}

// Update status (e.g. 'notified', 'cancelled', 'pending')
export async function updateRestockRequestStatus(
  id: string,
  status: 'pending' | 'notified' | 'cancelled',
  adminNote?: string
): Promise<void> {
  const existing = getLocalRestockRequests();
  const updated = existing.map(r => {
    if (r.id === id) {
      return {
        ...r,
        status,
        adminNote: adminNote !== undefined ? adminNote : r.adminNote,
        notifiedAt: status === 'notified' ? new Date().toISOString() : r.notifiedAt,
      };
    }
    return r;
  });

  saveLocalRestockRequests(updated);

  if (isSupabaseConfigured()) {
    try {
      await (supabase as any)
        .from('restock_requests')
        .update({
          status,
          admin_note: adminNote,
          notified_at: status === 'notified' ? new Date().toISOString() : undefined,
        })
        .eq('id', id);
    } catch {
      // local fallback
    }
  }
}

// Delete a request
export async function deleteRestockRequest(id: string): Promise<void> {
  const existing = getLocalRestockRequests();
  const updated = existing.filter(r => r.id !== id);
  saveLocalRestockRequests(updated);

  if (isSupabaseConfigured()) {
    try {
      await (supabase as any)
        .from('restock_requests')
        .delete()
        .eq('id', id);
    } catch {
      // local fallback
    }
  }
}

// Fetch all requests, optionally synchronizing from Supabase
export async function fetchAllRestockRequests(): Promise<RestockRequest[]> {
  let local = getLocalRestockRequests();

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await (supabase as any)
        .from('restock_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const cloudRequests: RestockRequest[] = data.map((d: any) => ({
          id: d.id,
          productId: d.product_id || d.productId,
          productName: d.product_name || d.productName,
          productImage: d.product_image || d.productImage,
          productPrice: Number(d.product_price || d.productPrice || 0),
          size: d.size || undefined,
          color: d.color || undefined,
          userId: d.user_id || d.userId,
          customerName: d.customer_name || d.customerName,
          customerEmail: d.customer_email || d.customerEmail,
          customerPhone: d.customer_phone || d.customerPhone || undefined,
          createdAt: d.created_at || d.createdAt,
          status: d.status || 'pending',
          notifiedAt: d.notified_at || d.notifiedAt || undefined,
          adminNote: d.admin_note || d.adminNote || undefined,
        }));

        // Merge cloud with local
        const mergedMap = new Map<string, RestockRequest>();
        cloudRequests.forEach(r => mergedMap.set(r.id, r));
        local.forEach(r => mergedMap.set(r.id, r));
        const merged = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        saveLocalRestockRequests(merged);
        return merged;
      }
    } catch {
      // Return local requests if Supabase query fails
    }
  }

  return local;
}

// Subscribe to restock request updates across components and tabs
export function subscribeToRestockRequests(callback: (requests: RestockRequest[]) => void): () => void {
  const handleUpdate = () => {
    callback(getLocalRestockRequests());
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getLocalRestockRequests());
    }
  };

  window.addEventListener(EVENT_NAME, handleUpdate);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}

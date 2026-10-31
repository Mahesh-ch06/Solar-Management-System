import { Customer, EnquiryStatus } from '../../../types/customer';
import { CustomerFormData } from '../../../utils/validators';
import {
  customers,
  addCustomer as dbAddCustomer,
  updateCustomer as dbUpdateCustomer,
  deleteCustomer as dbDeleteCustomer,
  deleteDuplicateCustomers as dbDeleteDuplicateCustomers,
} from '../../../store/inMemoryDb';
import { apiClient, USE_MOCK_DATA } from '../../../api/apiClient';

const SIMULATED_DELAY_MS = 150;

const delay = (ms: number = SIMULATED_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const customerService = {
  /**
   * Fetches the complete list of customers
   */
  async getCustomers(): Promise<Customer[]> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.get<{ success: boolean; data: Customer[] }>('/customers');
        if (res.data?.success && Array.isArray(res.data.data)) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('[customerService] API getCustomers failed, falling back to local store:', err);
      }
    }
    await delay();
    return [...customers];
  },

  /**
   * Fetches a single customer by id
   */
  async getCustomerById(id: string): Promise<Customer | undefined> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
        if (res.data?.success && res.data.data) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('[customerService] API getCustomerById failed, falling back to local store:', err);
      }
    }
    await delay();
    return customers.find((c) => c.id === id);
  },

  /**
   * Saves a new customer
   */
  async addCustomer(data: Omit<CustomerFormData, 'assignedTo'> & { assignedTo?: string; status?: EnquiryStatus }): Promise<Customer> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.post<{ success: boolean; data: Customer }>('/customers', data);
        if (res.data?.success && res.data.data) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('[customerService] API addCustomer failed, falling back to local store:', err);
      }
    }

    await delay();
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: `cust-${String(customers.length + 1).padStart(2, '0')}`,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      monthlyBill: Number(data.monthlyBill),
      requiredCapacityKW: Number(data.requiredCapacityKW),
      systemType: data.systemType,
      subsidyRequired: Boolean(data.subsidyRequired),
      enquirySource: data.enquirySource,
      notes: data.notes || '',
      assignedTo: data.assignedTo || '',
      status: data.status || 'NEW',
      createdAt: now,
      updatedAt: now,
    };
    dbAddCustomer(newCustomer);
    return newCustomer;
  },

  /**
   * Updates an existing customer record
   */
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.put<{ success: boolean; data: Customer }>(`/customers/${id}`, updates);
        if (res.data?.success && res.data.data) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('[customerService] API updateCustomer failed, falling back to local store:', err);
      }
    }

    await delay();
    const updated = dbUpdateCustomer(id, updates);
    return updated;
  },

  /**
   * Updates customer enquiry pipeline status
   */
  async updateCustomerStatus(id: string, status: EnquiryStatus): Promise<Customer | undefined> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.patch<{ success: boolean; data: Customer }>(`/customers/${id}/status`, { status });
        if (res.data?.success && res.data.data) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('[customerService] API updateCustomerStatus failed, falling back to local store:', err);
      }
    }

    await delay();
    return dbUpdateCustomer(id, { status });
  },

  /**
   * Updates customer project milestone stage and pipeline status
   */
  async updateCustomerMilestone(id: string, milestoneStep: number, status?: EnquiryStatus): Promise<Customer | undefined> {
    const updates: Partial<Customer> = { milestoneStep };
    if (status) updates.status = status;
    return this.updateCustomer(id, updates);
  },

  /**
   * Deletes a customer record
   */
  async deleteCustomer(id: string): Promise<boolean> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.delete<{ success: boolean; message?: string }>(`/customers/${id}`);
        if (!res.data?.success) {
          throw new Error(res.data?.message || 'Failed to delete customer on server');
        }
      } catch (err: any) {
        const serverError = err?.response?.data?.error;
        if (serverError) {
          throw new Error(serverError);
        }
        console.warn('[customerService] API deleteCustomer failed, proceeding with local deletion:', err);
      }
    }

    await delay();
    return dbDeleteCustomer(id);
  },

  /**
   * Cleans duplicate customer leads and purges mock entries
   */
  async deleteDuplicateCustomers(): Promise<number> {
    await delay();
    return dbDeleteDuplicateCustomers();
  },
};


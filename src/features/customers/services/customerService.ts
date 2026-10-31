import { Customer, EnquiryStatus } from '../../../types/customer';
import { CustomerFormData } from '../../../utils/validators';
import {
  customers,
  addCustomer as dbAddCustomer,
  updateCustomer as dbUpdateCustomer,
} from '../../../store/inMemoryDb';

const SIMULATED_DELAY_MS = 350;

const delay = (ms: number = SIMULATED_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const customerService = {
  /**
   * Fetches the complete list of customers from in-memory database
   */
  async getCustomers(): Promise<Customer[]> {
    await delay();
    return [...customers];
  },

  /**
   * Fetches a single customer by id
   */
  async getCustomerById(id: string): Promise<Customer | undefined> {
    await delay();
    return customers.find((c) => c.id === id);
  },

  /**
   * Saves a new customer to store and returns the created record
   */
  async addCustomer(data: CustomerFormData & { status?: EnquiryStatus }): Promise<Customer> {
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
      assignedTo: data.assignedTo,
      status: data.status || 'NEW',
      createdAt: now,
      updatedAt: now,
    };
    dbAddCustomer(newCustomer);
    return newCustomer;
  },

  /**
   * Updates only customer's enquiry status
   */
  async updateCustomerStatus(id: string, status: EnquiryStatus): Promise<Customer> {
    await delay();
    const updated = dbUpdateCustomer(id, { status });
    if (!updated) {
      throw new Error(`Customer with id ${id} not found`);
    }
    return updated;
  },

  /**
   * Full or partial update of customer details
   */
  async updateCustomer(
    id: string,
    data: Partial<Customer> | CustomerFormData
  ): Promise<Customer> {
    await delay();
    const updated = dbUpdateCustomer(id, data);
    if (!updated) {
      throw new Error(`Customer with id ${id} not found`);
    }
    return updated;
  },
};

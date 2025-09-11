import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { Invoice } from '../models/Invoice';

class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<void> {
    if (this.client && this.db) {
      console.log('✅ Using existing MongoDB connection');
      return;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    try {
      this.client = new MongoClient(uri, {
        maxPoolSize: 10, // Connection pool for concurrent requests
        connectTimeoutMS: 10000, // 10s timeout for connection
        retryWrites: true, // Retry write operations on failure
      });
      await this.client.connect();
      this.db = this.client.db('pdf_dashboard');
      console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw new Error('Failed to connect to MongoDB Atlas');
    }
  }

  // Made public to allow storage.ts to access it
  async ensureConnection(): Promise<Db> {
    if (!this.db || !this.client) {
      await this.connect();
    }
    return this.db!;
  }

  async getInvoicesCollection(): Promise<Collection<Invoice>> {
    const db = await this.ensureConnection();
    return db.collection<Invoice>('invoices');
  }

  async createInvoice(invoice: Omit<Invoice, '_id'>): Promise<string> {
    const collection = await this.getInvoicesCollection();
    const result = await collection.insertOne({
      ...invoice,
      createdAt: new Date().toISOString(),
    });
    return result.insertedId.toString();
  }

  async getInvoices(query?: { q?: string }): Promise<Invoice[]> {
    const collection = await this.getInvoicesCollection();
    let filter = {};
    if (query?.q) {
      filter = {
        $or: [
          { 'vendor.name': { $regex: query.q, $options: 'i' } },
          { 'invoice.number': { $regex: query.q, $options: 'i' } },
        ],
      };
    }
    return await collection.find(filter).sort({ createdAt: -1 }).toArray();
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const collection = await this.getInvoicesCollection();
    try {
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error(`Error fetching invoice with id ${id}:`, error);
      return null;
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<boolean> {
    const collection = await this.getInvoicesCollection();
    try {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`Error updating invoice with id ${id}:`, error);
      return false;
    }
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const collection = await this.getInvoicesCollection();
    try {
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`Error deleting invoice with id ${id}:`, error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

export const db = new DatabaseService();
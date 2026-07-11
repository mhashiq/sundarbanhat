import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabase';
import { Helmet } from 'react-helmet-async';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  ClipboardList, 
  MessageSquare, 
  LogOut, 
  TrendingUp, 
  DollarSign, 
  PlusCircle, 
  Trash2, 
  Edit, 
  FolderPlus, 
  Upload, 
  Eye 
} from 'lucide-react';
import { getImageUrl } from '../services/dataService';
import type { Product, Category } from '../services/dataService';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders' | 'messages'>('overview');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState({ revenue: 0, orderCount: 0, stockOut: 0, unreadMsgs: 0 });

  // Form edit states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product Form Fields
  const [pId, setPId] = useState('');
  const [pTitle, setPTitle] = useState('');
  const [pSubcategory, setPSubcategory] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pPriceNum, setPPriceNum] = useState(0);
  const [pWeight, setPWeight] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pHarvest, setPHarvest] = useState('');
  const [pStatus, setPStatus] = useState<'in-stock' | 'out-of-stock'>('in-stock');
  const [pStory, setPStory] = useState('');
  const [pBenefits, setPBenefits] = useState<string[]>([]);
  const [pStorage, setPStorage] = useState('');
  const [pImg, setPImg] = useState('');
  const [pStock, setPStock] = useState(10);
  const [pFeatured, setPFeatured] = useState(false);
  
  // File Upload states
  const [uploading, setUploading] = useState(false);
  const [benefitInput, setBenefitInput] = useState('');

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');

  // Selected Order Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Search & Filter states for Orders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Shipping edit states
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustAddr, setEditCustAddr] = useState('');
  const [editCustCity, setEditCustCity] = useState('');
  
  // Rejection state
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // Populate shipping edit fields when selectedOrder changes
  useEffect(() => {
    if (selectedOrder) {
      setEditCustName(selectedOrder.customer_name || '');
      setEditCustPhone(selectedOrder.phone || '');
      setEditCustAddr(selectedOrder.address || '');
      setEditCustCity(selectedOrder.city || '');
      setRejectReasonInput('');
    }
  }, [selectedOrder]);

  // Load all dashboard statistics & records on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Products
      const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      const mappedProds: Product[] = (prods || []).map(p => ({
        id: p.id,
        title: p.title,
        subcategory: p.subcategory,
        category: p.category,
        price: p.price,
        priceNum: Number(p.price_num),
        weight: p.weight,
        location: p.location,
        harvest: p.harvest,
        status: p.status as 'in-stock' | 'out-of-stock',
        story: p.story,
        benefits: p.benefits,
        storage: p.storage,
        img: p.img,
        stock: p.stock,
        is_featured: p.is_featured
      }));
      setProducts(mappedProds);

      // 2. Fetch Categories
      const { data: cats } = await supabase.from('categories').select('*').order('name', { ascending: true });
      setCategories(cats || []);
      // 3. Fetch Orders
      const { data: ords } = await supabase.from('orders').select('*, order_items(*, products(*)), payments(*)').order('created_at', { ascending: false });
      setOrders(ords || []);

      // 4. Fetch Contact Messages
      const { data: msgs } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
      setMessages(msgs || []);

      // 5. Calculate Metrics
      const totalRev = (ords || [])
        .filter(o => o.order_status !== 'cancelled' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total), 0);

      const stockOuts = mappedProds.filter(p => p.status === 'out-of-stock' || (p.stock !== undefined && p.stock <= 0)).length;
      const unreads = (msgs || []).filter(m => m.status === 'unread').length;

      setAnalytics({
        revenue: totalRev,
        orderCount: (ords || []).length,
        stockOut: stockOuts,
        unreadMsgs: unreads
      });

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Image upload directly to Supabase Storage Bucket
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to supabase storage bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Set public storage path to state
      const dbStoragePath = `storage/product-images/${filePath}`;
      setPImg(dbStoragePath);
      alert('ছবি সফলভাবে আপলোড করা হয়েছে!');
    } catch (err: any) {
      alert(`ছবি আপলোড ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setPBenefits([...pBenefits, benefitInput.trim()]);
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (idx: number) => {
    setPBenefits(pBenefits.filter((_, i) => i !== idx));
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setPId('');
    setPTitle('');
    setPSubcategory('');
    setPCategory(categories[0]?.slug || '');
    setPPrice('');
    setPPriceNum(0);
    setPWeight('');
    setPLocation('');
    setPHarvest('');
    setPStatus('in-stock');
    setPStory('');
    setPBenefits([]);
    setPStorage('');
    setPImg('');
    setPStock(10);
    setPFeatured(false);
    setShowProductForm(true);
  };

  const openEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setPId(prod.id);
    setPTitle(prod.title);
    setPSubcategory(prod.subcategory);
    setPCategory(prod.category);
    setPPrice(prod.price);
    setPPriceNum(prod.priceNum);
    setPWeight(prod.weight);
    setPLocation(prod.location);
    setPHarvest(prod.harvest);
    setPStatus(prod.status);
    setPStory(prod.story);
    setPBenefits(prod.benefits);
    setPStorage(prod.storage);
    setPImg(prod.img);
    setPStock(prod.stock || 10);
    setPFeatured(prod.is_featured || false);
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pId || !pTitle || !pPrice || !pPriceNum || !pWeight || !pImg) {
      alert('অনুগ্রহ করে তারকাচিহ্নিত (*) প্রয়োজনীয় ঘরগুলো পূরণ করুন।');
      return;
    }

    setLoading(true);

    const payload = {
      id: pId.trim(),
      title: pTitle.trim(),
      subcategory: pSubcategory.trim(),
      category: pCategory,
      price: pPrice.trim(),
      price_num: pPriceNum,
      weight: pWeight.trim(),
      location: pLocation.trim(),
      harvest: pHarvest.trim(),
      status: pStatus,
      story: pStory.trim(),
      benefits: pBenefits,
      storage: pStorage.trim(),
      img: pImg,
      stock: pStock,
      is_featured: pFeatured,
      updated_at: new Date()
    };

    try {
      if (editingProduct) {
        // Edit Mode
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
        alert('পণ্য সফলভাবে আপডেট করা হয়েছে।');
      } else {
        // Insert Mode
        const { error } = await supabase
          .from('products')
          .insert(payload);
        if (error) throw error;
        alert('নতুন পণ্য সফলভাবে যোগ করা হয়েছে।');
      }
      setShowProductForm(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(`পণ্য সংরক্ষণ ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই পণ্যটি ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      alert('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;
    try {
      const { error } = await supabase
        .from('categories')
        .insert({ slug: catSlug.trim().toLowerCase(), name: catName.trim() });
      if (error) throw error;
      alert('ক্যাটাগরি সফলভাবে তৈরি হয়েছে।');
      setCatName('');
      setCatSlug('');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    if (!window.confirm('এই ক্যাটাগরি ডিলিট করলে এর অধীনে থাকা সব পণ্যও ডিলিট হতে পারে। ডিলিট করবেন?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('slug', slug);
      if (error) throw error;
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: status, updated_at: new Date() })
        .eq('id', orderId);
      if (error) throw error;

      // Log status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: status,
          notes: `অর্ডার স্ট্যাটাস পরিবর্তন করা হয়েছে: ${status}`
        });

      fetchDashboardData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: status });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: status, updated_at: new Date() })
        .eq('id', orderId);
      if (error) throw error;

      // Log status history
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: status === 'paid' ? 'payment_approved' : 'pending_payment',
          notes: `পেমেন্ট স্ট্যাটাস পরিবর্তন করা হয়েছে: ${status}`
        });

      fetchDashboardData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: status });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprovePayment = async (orderId: string, paymentId: string) => {
    try {
      setLoading(true);
      // 1. Update payment status to approved
      const { error: payError } = await supabase
        .from('payments')
        .update({ status: 'approved' })
        .eq('id', paymentId);
      if (payError) throw payError;

      // 2. Update order status to payment_approved and payment_status to paid
      const { error: ordError } = await supabase
        .from('orders')
        .update({ order_status: 'payment_approved', payment_status: 'paid', updated_at: new Date() })
        .eq('id', orderId);
      if (ordError) throw ordError;

      // 3. Add status history entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: 'payment_approved',
          notes: 'অ্যাডমিন কর্তৃক পেমেন্ট যাচাই সম্পন্ন ও অনুমোদিত হয়েছে।'
        });

      alert('পেমেন্ট সফলভাবে অনুমোদিত হয়েছে!');
      fetchDashboardData();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(`ত্রুটি: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPayment = async (orderId: string, paymentId: string, reason: string) => {
    if (!reason.trim()) {
      alert('প্রত্যাখ্যানের কারণ উল্লেখ করুন।');
      return;
    }
    try {
      setLoading(true);
      // 1. Update payment status to rejected
      const { error: payError } = await supabase
        .from('payments')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', paymentId);
      if (payError) throw payError;

      // 2. Revert order status to pending_payment and payment_status to failed
      const { error: ordError } = await supabase
        .from('orders')
        .update({ order_status: 'pending_payment', payment_status: 'failed', updated_at: new Date() })
        .eq('id', orderId);
      if (ordError) throw ordError;

      // 3. Add status history entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: orderId,
          status: 'pending_payment',
          notes: `পেমেন্ট প্রত্যাখ্যাত হয়েছে। কারণ: ${reason}`
        });

      alert('পেমেন্ট প্রত্যাখ্যান করা হয়েছে!');
      fetchDashboardData();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(`ত্রুটি: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveShippingInfo = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: editCustName.trim(),
          phone: editCustPhone.trim(),
          address: editCustAddr.trim(),
          city: editCustCity.trim(),
          updated_at: new Date()
        })
        .eq('id', selectedOrder.id);
      if (error) throw error;
      
      alert('শিপিং তথ্য সফলভাবে আপডেট করা হয়েছে!');
      fetchDashboardData();
      setSelectedOrder({
        ...selectedOrder,
        customer_name: editCustName.trim(),
        phone: editCustPhone.trim(),
        address: editCustAddr.trim(),
        city: editCustCity.trim()
      });
    } catch (err: any) {
      alert(`শিপিং আপডেট ব্যর্থ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Order ID,Customer Name,Phone,Date,Subtotal,Shipping,Total,Payment Method,Order Status,Payment Status\n'];
    const rows = orders.map(o => `"${o.transaction_id}","${o.customer_name}","${o.phone}","${new Date(o.created_at).toLocaleDateString()}","${o.subtotal}","${o.shipping_cost}","${o.total}","${o.payment_method}","${o.order_status}","${o.payment_status}"`);
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateMessageStatus = async (msgId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', msgId);
      if (error) throw error;
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('বার্তাটি ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', msgId);
      if (error) throw error;
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-sand)', minHeight: '90vh', padding: '0px' }}>
      <Helmet>
        <title>অ্যাডমিন ড্যাশবোর্ড - সুন্দরবন হাট</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Main Admin Dashboard Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '90vh' }}>
        
        {/* Left Sidebar */}
        <div style={{
          backgroundColor: 'var(--color-forest-dark)',
          color: '#fff',
          padding: '30px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '5px double var(--color-mud)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '15px' }}>
              <span style={{ fontSize: '1.8rem' }}>🍃</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-honey)' }}>অ্যাডমিন প্যানেল</span>
            </div>

            {/* Sidebar Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Overview */}
              <button 
                onClick={() => setActiveTab('overview')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'overview' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'overview' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'overview' ? 'bold' : 'normal'
                }}
              >
                <LayoutDashboard size={18} /> ওভারভিউ
              </button>

              {/* Products */}
              <button 
                onClick={() => setActiveTab('products')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'products' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'products' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'products' ? 'bold' : 'normal'
                }}
              >
                <ShoppingBag size={18} /> পণ্যসমূহ
              </button>

              {/* Categories */}
              <button 
                onClick={() => setActiveTab('categories')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'categories' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'categories' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'categories' ? 'bold' : 'normal'
                }}
              >
                <Tags size={18} /> ক্যাটাগরি
              </button>

              {/* Orders */}
              <button 
                onClick={() => setActiveTab('orders')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'orders' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'orders' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'orders' ? 'bold' : 'normal'
                }}
              >
                <ClipboardList size={18} /> অর্ডারসমূহ
                {orders.filter(o => o.order_status === 'pending').length > 0 && (
                  <span style={{ marginLeft: 'auto', backgroundColor: '#e53935', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {orders.filter(o => o.order_status === 'pending').length}
                  </span>
                )}
              </button>

              {/* Messages */}
              <button 
                onClick={() => setActiveTab('messages')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: activeTab === 'messages' ? 'var(--color-mangrove)' : 'transparent',
                  color: activeTab === 'messages' ? 'var(--color-honey)' : '#ddd',
                  fontWeight: activeTab === 'messages' ? 'bold' : 'normal'
                }}
              >
                <MessageSquare size={18} /> বার্তা ইনবক্স
                {analytics.unreadMsgs > 0 && (
                  <span style={{ marginLeft: 'auto', backgroundColor: 'var(--color-honey-glow)', color: 'var(--color-forest-dark)', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {analytics.unreadMsgs}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Log Out Button */}
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 15px', borderRadius: 'var(--border-radius-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
              backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff6666'
            }}
          >
            <LogOut size={18} /> লগআউট করুন
          </button>
        </div>

        {/* Right Tab Content View */}
        <div style={{ padding: '40px', overflowY: 'auto', maxHeight: '90vh' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '30px', fontWeight: '800' }}>📊 ওভারভিউ ড্যাশবোর্ড</h2>
              
              {/* Analytics Metric Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                {/* Total Revenue */}
                <div style={{ background: '#fff', padding: '25px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray', fontSize: '0.88rem', marginBottom: '10px' }}>
                    <span>মোট বিক্রয়মূল্য (পেইড)</span>
                    <DollarSign size={20} style={{ color: 'var(--color-mangrove)' }} />
                  </div>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)' }}>৳{analytics.revenue}</strong>
                </div>

                {/* Total Orders */}
                <div style={{ background: '#fff', padding: '25px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray', fontSize: '0.88rem', marginBottom: '10px' }}>
                    <span>মোট অর্ডার</span>
                    <ClipboardList size={20} style={{ color: 'var(--color-honey-glow)' }} />
                  </div>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)' }}>{analytics.orderCount}টি</strong>
                </div>

                {/* Stock Out */}
                <div style={{ background: '#fff', padding: '25px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray', fontSize: '0.88rem', marginBottom: '10px' }}>
                    <span>স্টক আউট পণ্য</span>
                    <TrendingUp size={20} style={{ color: '#e53935' }} />
                  </div>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)' }}>{analytics.stockOut}টি</strong>
                </div>

                {/* Unread Messages */}
                <div style={{ background: '#fff', padding: '25px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray', fontSize: '0.88rem', marginBottom: '10px' }}>
                    <span>নতুন বার্তা</span>
                    <MessageSquare size={20} style={{ color: 'blue' }} />
                  </div>
                  <strong style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)' }}>{analytics.unreadMsgs}টি</strong>
                </div>
              </div>

              {/* Order Activity list in Overview */}
              <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', marginBottom: '20px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px' }}>
                  ⏳ সাম্প্রতিক পাঁচ অর্ডার
                </h3>
                {orders.slice(0, 5).length === 0 ? (
                  <p style={{ color: 'gray', fontSize: '0.9rem', textAlign: 'center' }}>কোনো অর্ডার পাওয়া যায়নি।</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '8px', color: 'var(--color-mud)', fontWeight: 'bold' }}>
                          <th style={{ padding: '12px' }}>অর্ডার নম্বর</th>
                          <th style={{ padding: '12px' }}>গ্রাহকের নাম</th>
                          <th style={{ padding: '12px' }}>মোবাইল</th>
                          <th style={{ padding: '12px' }}>সর্বমোট</th>
                          <th style={{ padding: '12px' }}>অর্ডার স্ট্যাটাস</th>
                          <th style={{ padding: '12px' }}>পেমেন্ট স্ট্যাটাস</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((o) => (
                          <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>#{o.transaction_id}</td>
                            <td style={{ padding: '12px' }}>{o.customer_name}</td>
                            <td style={{ padding: '12px' }}>{o.phone}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--color-mangrove)' }}>৳{o.total}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: 'var(--border-radius-full)', fontSize: '0.78rem', fontWeight: 'bold',
                                backgroundColor: o.order_status === 'delivered' ? '#e8f5e9' : o.order_status === 'cancelled' ? '#ffebee' : '#fff3e0',
                                color: o.order_status === 'delivered' ? '#2e7d32' : o.order_status === 'cancelled' ? '#c62828' : '#e65100'
                              }}>{o.order_status}</span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: 'var(--border-radius-full)', fontSize: '0.78rem', fontWeight: 'bold',
                                backgroundColor: o.payment_status === 'paid' ? '#e8f5e9' : '#ffebee',
                                color: o.payment_status === 'paid' ? '#2e7d32' : '#c62828'
                              }}>{o.payment_status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', fontWeight: '800', margin: 0 }}>📦 পণ্য ব্যবস্থাপনা</h2>
                {!showProductForm && (
                  <button onClick={openAddForm} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: 'var(--border-radius-md)' }}>
                    <PlusCircle size={18} /> নতুন পণ্য যোগ করুন
                  </button>
                )}
              </div>

              {/* Product Form Add / Edit */}
              {showProductForm ? (
                <div style={{ background: '#fff', padding: '35px', borderRadius: 'var(--border-radius-lg)', border: '2px solid var(--color-mud)', boxShadow: '0 10px 25px var(--color-shadow)', marginBottom: '30px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-mangrove)', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '25px' }}>
                    {editingProduct ? '✏️ পণ্য পরিবর্তন করুন' : '➕ নতুন পণ্য সংযোজন ফরম'}
                  </h3>

                  <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* ID Slug */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পণ্য ID (Slug-like, e.g. honey-kholisha) *</label>
                      <input 
                        type="text" 
                        value={pId}
                        onChange={(e) => setPId(e.target.value)}
                        disabled={!!editingProduct}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: honey-kholisha"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পণ্যের নাম (Bengali) *</label>
                      <input 
                        type="text" 
                        value={pTitle}
                        onChange={(e) => setPTitle(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: সুন্দরবনের খাঁটি খলিশা মধু"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>ক্যাটাগরি *</label>
                      <select 
                        value={pCategory}
                        onChange={(e) => setPCategory(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#fff' }}
                      >
                        {categories.map(c => (
                          <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategory */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>উপ-ক্যাটাগরি</label>
                      <input 
                        type="text" 
                        value={pSubcategory}
                        onChange={(e) => setPSubcategory(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: সুন্দরবনের খাঁটি মধু"
                      />
                    </div>

                    {/* Price Display */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>মূল্যমান লেখা (Price text display) *</label>
                      <input 
                        type="text" 
                        value={pPrice}
                        onChange={(e) => setPPrice(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: ৳৮৫০"
                      />
                    </div>

                    {/* Price Num */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>মূল্যমান সংখ্যা (GA4 Value) *</label>
                      <input 
                        type="number" 
                        value={pPriceNum}
                        onChange={(e) => setPPriceNum(Number(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: 850"
                      />
                    </div>

                    {/* Weight */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>প্যাক সাইজ / ওজন *</label>
                      <input 
                        type="text" 
                        value={pWeight}
                        onChange={(e) => setPWeight(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: ৫০০ গ্রাম"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>সংগৃহীত স্থান</label>
                      <input 
                        type="text" 
                        value={pLocation}
                        onChange={(e) => setPLocation(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: গহীন সুন্দরবন"
                      />
                    </div>

                    {/* Harvest */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>সংগ্রহের সময়কাল</label>
                      <input 
                        type="text" 
                        value={pHarvest}
                        onChange={(e) => setPHarvest(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="যেমন: মে ২০২৬"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>স্টক স্ট্যাটাস *</label>
                      <select 
                        value={pStatus}
                        onChange={(e) => setPStatus(e.target.value as any)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#fff' }}
                      >
                        <option value="in-stock">ইন স্টক (In-stock)</option>
                        <option value="out-of-stock">আউট অফ স্টক (Out-of-stock)</option>
                      </select>
                    </div>

                    {/* Stock limit */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>স্টক পরিমাণ *</label>
                      <input 
                        type="number" 
                        value={pStock}
                        onChange={(e) => setPStock(Number(e.target.value))}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                        placeholder="जैसे: 10"
                      />
                    </div>

                    {/* Featured */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '30px' }}>
                      <input 
                        type="checkbox" 
                        id="featured" 
                        checked={pFeatured} 
                        onChange={(e) => setPFeatured(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-mangrove)' }}
                      />
                      <label htmlFor="featured" style={{ fontSize: '0.92rem', color: 'var(--color-forest-dark)', fontWeight: 'bold', cursor: 'pointer' }}>হোমপেজে ফিচারড পণ্য হিসেবে দেখান</label>
                    </div>

                    {/* Image Upload Input */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>পণ্যের ছবি *</label>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={pImg} 
                          onChange={(e) => setPImg(e.target.value)} 
                          placeholder="আপলোড করা ফাইলের URL এখানে আসবে..."
                          style={{ flexGrow: 1, padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#f9f9f9' }} 
                        />
                        
                        <div style={{ position: 'relative' }}>
                          <button 
                            type="button" 
                            disabled={uploading}
                            className="btn btn-outline" 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 15px', fontSize: '0.9rem' }}
                          >
                            <Upload size={16} /> {uploading ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড করুন'}
                          </button>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                          />
                        </div>
                      </div>
                      {pImg && (
                        <div style={{ marginTop: '10px' }}>
                          <img src={getImageUrl(pImg)} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
                        </div>
                      )}
                    </div>

                    {/* Story description */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>সংগ্রহের গল্প ও বিবরণ *</label>
                      <textarea 
                        value={pStory} 
                        onChange={(e) => setPStory(e.target.value)}
                        rows={4}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontFamily: 'inherit' }}
                        placeholder="পণ্যের সংগ্রহের বর্ণনা, বিশেষত্ব ও গল্প লিখুন..."
                      />
                    </div>

                    {/* Storage method */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>সংরক্ষণ পদ্ধতি *</label>
                      <textarea 
                        value={pStorage} 
                        onChange={(e) => setPStorage(e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', fontFamily: 'inherit' }}
                        placeholder="কীভাবে সংরক্ষণ করতে হবে..."
                      />
                    </div>

                    {/* Benefits lists */}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>উপকারিতা ও বৈশিষ্ট্য সমূহ</label>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input 
                          type="text" 
                          value={benefitInput} 
                          onChange={(e) => setBenefitInput(e.target.value)} 
                          style={{ flexGrow: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }} 
                          placeholder="একটি উপকারিতা লিখুন (যেমন: রোগ প্রতিরোধ ক্ষমতা বাড়ায়)..." 
                        />
                        <button type="button" onClick={handleAddBenefit} className="btn btn-outline" style={{ padding: '8px 15px' }}>যোগ করুন</button>
                      </div>

                      <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {pBenefits.map((b, idx) => (
                          <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-sand)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.88rem' }}>
                            <span>✓ {b}</span>
                            <button type="button" onClick={() => handleRemoveBenefit(idx)} style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer' }}>মুছে দিন</button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Form actions */}
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                      <button type="button" onClick={() => setShowProductForm(false)} className="btn btn-outline" style={{ padding: '10px 20px' }}>বাতিল</button>
                      <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '10px 25px' }}>
                        {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                      </button>
                    </div>

                  </form>
                </div>
              ) : (
                /* Products Table */
                <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-mud)', fontWeight: 'bold' }}>
                          <th style={{ padding: '12px' }}>ছবি</th>
                          <th style={{ padding: '12px' }}>নাম ও আইডি</th>
                          <th style={{ padding: '12px' }}>ক্যাটাগরি</th>
                          <th style={{ padding: '12px' }}>মূল্যমান</th>
                          <th style={{ padding: '12px' }}>স্টক</th>
                          <th style={{ padding: '12px' }}>স্ট্যাটাস</th>
                          <th style={{ padding: '12px' }}>ফিচারড</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'gray' }}>কোনো পণ্য পাওয়া যায়নি।</td>
                          </tr>
                        ) : (
                          products.map((prod) => (
                            <tr key={prod.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '12px' }}>
                                <img src={getImageUrl(prod.img)} alt={prod.title} style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: 'var(--color-sand)', borderRadius: '4px' }} />
                              </td>
                              <td style={{ padding: '12px' }}>
                                <strong style={{ color: 'var(--color-forest-dark)', display: 'block' }}>{prod.title}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'gray' }}>ID: {prod.id}</span>
                              </td>
                              <td style={{ padding: '12px' }}>{prod.category}</td>
                              <td style={{ padding: '12px', fontWeight: 'bold' }}>{prod.price} ({prod.priceNum})</td>
                              <td style={{ padding: '12px' }}>{prod.stock !== undefined ? prod.stock : 10}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                  backgroundColor: prod.status === 'in-stock' ? '#e8f5e9' : '#ffebee',
                                  color: prod.status === 'in-stock' ? '#2e7d32' : '#c62828'
                                }}>{prod.status}</span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                {prod.is_featured ? <span style={{ color: 'var(--color-honey-glow)', fontWeight: 'bold' }}>★ Featured</span> : 'No'}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button onClick={() => openEditForm(prod)} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', padding: '4px' }} title="এডিট"><Edit size={16} /></button>
                                  <button onClick={() => handleDeleteProduct(prod.id)} style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', padding: '4px' }} title="ডিলিট"><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '30px', fontWeight: '800' }}>🏷️ ক্যাটাগরি ব্যবস্থাপনা</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
                {/* Add Category Form */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)', height: 'fit-content' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', marginBottom: '15px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                    নতুন ক্যাটাগরি তৈরি করুন
                  </h3>
                  <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>ক্যাটাগরির নাম (যেমন: ফল)</label>
                      <input 
                        type="text" 
                        value={catName} 
                        onChange={(e) => setCatName(e.target.value)} 
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }} 
                        placeholder="যেমন: ফল" 
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-mud)', fontWeight: 'bold', marginBottom: '6px' }}>ক্যাটাগরি Slug (ID, e.g. fruit)</label>
                      <input 
                        type="text" 
                        value={catSlug} 
                        onChange={(e) => setCatSlug(e.target.value)} 
                        style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }} 
                        placeholder="যেমন: fruit" 
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <FolderPlus size={16} /> ক্যাটাগরি যোগ করুন
                    </button>
                  </form>
                </div>

                {/* Categories List */}
                <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', marginBottom: '15px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '8px' }}>
                    ক্যাটাগরি তালিকা ({categories.length})
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {categories.map((c) => (
                      <div 
                        key={c.slug}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 20px',
                          backgroundColor: 'var(--color-sand)',
                          borderRadius: 'var(--border-radius-sm)',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--color-forest-dark)' }}>{c.name}</strong>
                          <span style={{ fontSize: '0.78rem', color: 'gray', marginLeft: '10px' }}>Slug: {c.slug}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteCategory(c.slug)}
                          style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', fontWeight: '800', margin: 0 }}>📦 অর্ডার সমূহ</h2>
                <button 
                  onClick={exportToCSV}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
                >
                  📥 এক্সপোর্ট করুন (CSV)
                </button>
              </div>

              {/* Search & Filters */}
              <div style={{
                background: '#fff', padding: '20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border)',
                marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'
              }}>
                {/* Search query */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>অর্ডার খুঁজুন</label>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="অর্ডার নম্বর/গ্রাহক/মোবাইল..."
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.88rem' }}
                  />
                </div>

                {/* Status filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>অর্ডার স্ট্যাটাস</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', fontSize: '0.88rem' }}
                  >
                    <option value="all">সকল অর্ডার</option>
                    <option value="pending_payment">Pending Payment</option>
                    <option value="payment_submitted">Payment Submitted</option>
                    <option value="payment_verification">Payment Verification</option>
                    <option value="payment_approved">Payment Approved</option>
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Payment filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-mud)', marginBottom: '5px' }}>পেমেন্ট স্ট্যাটাস</label>
                  <select 
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff', fontSize: '0.88rem' }}
                  >
                    <option value="all">সকল পেমেন্ট</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
              
              {/* Order Detail Modal Modal view */}
              {selectedOrder && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'rgba(7, 34, 17, 0.6)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px'
                }}>
                  <div style={{
                    background: '#fff', borderRadius: 'var(--border-radius-lg)', border: '4px solid var(--color-mud)',
                    width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', position: 'relative'
                  }}>
                    <button 
                      onClick={() => setSelectedOrder(null)} 
                      style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                    >✕</button>

                    <h3 style={{ color: 'var(--color-forest-dark)', fontSize: '1.3rem', marginBottom: '20px', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginTop: 0 }}>
                      অর্ডার নম্বর: #{selectedOrder.transaction_id}
                    </h3>

                    {/* Edit Shipping Panel */}
                    <div style={{ backgroundColor: 'var(--color-sand)', padding: '20px', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 15px 0', fontSize: '0.95rem', color: 'var(--color-forest-dark)', fontWeight: 'bold' }}>📍 শিপিং ও যোগাযোগ তথ্য সংশোধন করুন</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>গ্রাহকের নাম:</label>
                          <input 
                            type="text" 
                            value={editCustName}
                            onChange={(e) => setEditCustName(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>মোবাইল নম্বর:</label>
                          <input 
                            type="text" 
                            value={editCustPhone}
                            onChange={(e) => setEditCustPhone(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>পূর্ণ ঠিকানা:</label>
                          <textarea 
                            value={editCustAddr}
                            onChange={(e) => setEditCustAddr(e.target.value)}
                            rows={2}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px', fontFamily: 'inherit' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontWeight: 'bold', color: 'gray', marginBottom: '4px' }}>শহর/জেলা:</label>
                          <input 
                            type="text" 
                            value={editCustCity}
                            onChange={(e) => setEditCustCity(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                          <button 
                            type="button" 
                            onClick={handleSaveShippingInfo}
                            className="btn btn-primary"
                            style={{ padding: '8px 15px', fontSize: '0.82rem', fontWeight: 'bold' }}
                          >
                            পরিবর্তন সংরক্ষণ
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Submitted Payments Panel */}
                    {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                      <div style={{ border: '2px dashed var(--color-honey)', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fffcf4' }}>
                        <h4 style={{ margin: '0 0 15px 0', fontSize: '0.98rem', color: 'var(--color-forest-dark)', fontWeight: 'bold' }}>💳 গ্রাহকের প্রেরিত পেমেন্ট বিবরণী:</h4>
                        {selectedOrder.payments.map((pay: any) => (
                          <div key={pay.id} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div style={{ flexGrow: 1, fontSize: '0.88rem' }}>
                              <p style={{ margin: '0 0 5px 0' }}><strong>পদ্ধতি:</strong> {pay.payment_method}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>Transaction ID:</strong> <strong style={{ color: 'var(--color-mangrove)' }}>{pay.transaction_id}</strong></p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>টাকার পরিমাণ:</strong> ৳{pay.amount}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>তারিখ:</strong> {new Date(pay.payment_date).toLocaleString('bn-BD')}</p>
                              <p style={{ margin: '0 0 5px 0' }}><strong>অবস্থা:</strong> 
                                <span style={{ marginLeft: '6px', fontWeight: 'bold', color: pay.status === 'approved' ? 'green' : pay.status === 'rejected' ? 'red' : 'orange' }}>
                                  {pay.status === 'approved' ? 'অনুমোদিত (Approved)' : pay.status === 'rejected' ? 'প্রত্যাখ্যাত (Rejected)' : 'পেন্ডিং (Pending)'}
                                </span>
                              </p>
                              {pay.rejection_reason && <p style={{ margin: '5px 0 0 0', color: 'red' }}><strong>প্রত্যাখ্যানের কারণ:</strong> {pay.rejection_reason}</p>}
                            </div>

                            {pay.screenshot_url && (
                              <div style={{ width: '120px', flexShrink: 0, textAlign: 'center' }}>
                                <a href={getImageUrl(pay.screenshot_url)} target="_blank" rel="noreferrer">
                                  <img 
                                    src={getImageUrl(pay.screenshot_url)} 
                                    alt="Payment screenshot" 
                                    style={{ width: '100%', maxHeight: '100px', objectFit: 'contain', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                  />
                                </a>
                                <span style={{ fontSize: '0.72rem', color: 'gray', display: 'block', marginTop: '4px' }}>বড় করে দেখতে ক্লিক করুন</span>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Approve/Reject verification buttons */}
                        {selectedOrder.payments.some((p: any) => p.status === 'pending') && (
                          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '15px', marginTop: '15px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>পেমেন্ট অনুমোদন অ্যাকশন:</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                onClick={() => handleApprovePayment(selectedOrder.id, selectedOrder.payments.find((p: any) => p.status === 'pending').id)}
                                className="btn btn-primary"
                                style={{ padding: '8px 15px', fontSize: '0.85rem', fontWeight: 'bold' }}
                              >
                                পেমেন্ট অনুমোদন করুন (Approve)
                              </button>
                              
                              <div style={{ display: 'flex', gap: '5px', flexGrow: 1 }}>
                                <input 
                                  type="text" 
                                  placeholder="বাতিলের কারণ লিখুন..." 
                                  value={rejectReasonInput}
                                  onChange={(e) => setRejectReasonInput(e.target.value)}
                                  style={{ flexGrow: 1, padding: '6px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.82rem' }}
                                />
                                <button 
                                  onClick={() => handleRejectPayment(selectedOrder.id, selectedOrder.payments.find((p: any) => p.status === 'pending').id, rejectReasonInput)}
                                  className="btn btn-outline"
                                  style={{ padding: '8px 12px', fontSize: '0.82rem', borderColor: '#ff4444', color: '#ff4444' }}
                                >
                                  প্রত্যাখ্যান (Reject)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Update actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-mud)' }}>অর্ডার স্ট্যাটাস</label>
                        <select 
                          value={selectedOrder.order_status} 
                          onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff' }}
                        >
                          <option value="pending_payment">Pending Payment</option>
                          <option value="payment_submitted">Payment Submitted</option>
                          <option value="payment_verification">Payment Verification</option>
                          <option value="payment_approved">Payment Approved</option>
                          <option value="processing">Processing</option>
                          <option value="packed">Packed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-mud)' }}>পেমেন্ট স্ট্যাটাস</label>
                        <select 
                          value={selectedOrder.payment_status} 
                          onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                          style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: '#fff' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                    </div>

                    {/* Items table */}
                    <h4 style={{ color: 'var(--color-forest-dark)', fontSize: '0.98rem', marginBottom: '10px' }}>📦 পণ্য তালিকা:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      {(selectedOrder.order_items || []).map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-sand)', paddingBottom: '8px' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-forest-dark)', fontSize: '0.92rem' }}>{item.products?.title || 'Unknown Product'}</span>
                            <span style={{ fontSize: '0.78rem', color: 'gray', marginLeft: '10px' }}>x{item.quantity} ({item.products?.weight})</span>
                          </div>
                          <span style={{ fontWeight: 'bold' }}>৳{item.price_num * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right', alignItems: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '15px' }}>
                      <div style={{ display: 'flex', width: '200px', justifyContent: 'space-between', fontSize: '0.85rem', color: 'gray' }}>
                        <span>উপমোট মূল্য:</span>
                        <span>৳{selectedOrder.subtotal}</span>
                      </div>
                      <div style={{ display: 'flex', width: '200px', justifyContent: 'space-between', fontSize: '0.85rem', color: 'gray' }}>
                        <span>ডেলিভারি চার্জ:</span>
                        <span>৳{selectedOrder.shipping_cost}</span>
                      </div>
                      <div style={{ display: 'flex', width: '200px', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-mangrove)', borderTop: '1px dashed var(--color-border)', paddingTop: '6px', marginTop: '4px' }}>
                        <span>সর্বমোট:</span>
                        <span>৳{selectedOrder.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order List Table */}
              <div style={{ background: '#fff', padding: '30px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 10px 25px var(--color-shadow)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-mud)', fontWeight: 'bold' }}>
                        <th style={{ padding: '12px' }}>অর্ডার নম্বর</th>
                        <th style={{ padding: '12px' }}>গ্রাহকের নাম</th>
                        <th style={{ padding: '12px' }}>মোবাইল</th>
                        <th style={{ padding: '12px' }}>তারিখ</th>
                        <th style={{ padding: '12px' }}>মোট</th>
                        <th style={{ padding: '12px' }}>অর্ডার স্ট্যাটাস</th>
                        <th style={{ padding: '12px' }}>পেমেন্ট স্ট্যাটাস</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>বিস্তারিত</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => {
                        const matchesSearch = 
                          o.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.phone.includes(searchQuery);
                        
                        const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
                        const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;

                        return matchesSearch && matchesStatus && matchesPayment;
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'gray' }}>কোনো অর্ডার পাওয়া যায়নি।</td>
                        </tr>
                      ) : (
                        orders.filter(o => {
                          const matchesSearch = 
                            o.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.phone.includes(searchQuery);
                          
                          const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
                          const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;

                          return matchesSearch && matchesStatus && matchesPayment;
                        }).map((o) => (
                          <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>#{o.transaction_id}</td>
                            <td style={{ padding: '12px' }}>{o.customer_name}</td>
                            <td style={{ padding: '12px' }}>{o.phone}</td>
                            <td style={{ padding: '12px' }}>{new Date(o.created_at).toLocaleDateString('bn-BD')}</td>
                            <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--color-mangrove)' }}>৳{o.total}</td>
                            <td style={{ padding: '12px' }}>
                              <select 
                                value={o.order_status} 
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                style={{
                                  padding: '4px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#fff', fontWeight: 'bold',
                                  color: o.order_status === 'delivered' ? '#2e7d32' : o.order_status === 'cancelled' ? '#c62828' : '#e65100'
                                }}
                              >
                                <option value="pending_payment">Pending Payment</option>
                                <option value="payment_submitted">Payment Submitted</option>
                                <option value="payment_verification">Payment Verification</option>
                                <option value="payment_approved">Payment Approved</option>
                                <option value="processing">Processing</option>
                                <option value="packed">Packed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <select 
                                value={o.payment_status} 
                                onChange={(e) => handleUpdatePaymentStatus(o.id, e.target.value)}
                                style={{
                                  padding: '4px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#fff', fontWeight: 'bold',
                                  color: o.payment_status === 'paid' ? '#2e7d32' : '#c62828'
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button onClick={() => setSelectedOrder(o)} style={{ background: 'none', border: 'none', color: 'var(--color-mangrove)', cursor: 'pointer', padding: '4px' }}>
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MESSAGES */}
          {activeTab === 'messages' && (
            <div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '30px', fontWeight: '800' }}>✉️ বার্তা ইনবক্স</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {messages.length === 0 ? (
                  <div style={{ background: '#fff', padding: '30px', textAlign: 'center', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', color: 'gray' }}>
                    ইনবক্স একদম খালি! কোনো নতুন বার্তা পাওয়া যায়নি।
                  </div>
                ) : (
                  messages.map((m) => (
                    <div 
                      key={m.id}
                      style={{
                        background: '#fff', padding: '25px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 15px var(--color-shadow)',
                        borderLeft: `5px solid ${m.status === 'unread' ? 'var(--color-honey-glow)' : 'var(--color-border)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed var(--color-border)', paddingBottom: '10px', marginBottom: '15px' }}>
                        <div>
                          <strong style={{ color: 'var(--color-forest-dark)', fontSize: '1.05rem', display: 'block' }}>{m.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'gray' }}>📱 {m.phone} | ✉️ {m.email || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'gray' }}>{new Date(m.created_at).toLocaleString('bn-BD')}</span>
                          
                          <select 
                            value={m.status} 
                            onChange={(e) => handleUpdateMessageStatus(m.id, e.target.value)}
                            style={{ padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '0.78rem', backgroundColor: '#fff' }}
                          >
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                          </select>
                          
                          <button 
                            onClick={() => handleDeleteMessage(m.id)}
                            style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', padding: '2px' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-light)', margin: 0, fontWeight: m.status === 'unread' ? 'bold' : 'normal', whiteSpace: 'pre-wrap' }}>
                        <strong>বিষয়: {m.subject || 'সাধারণ যোগাযোগ'}</strong><br />
                        {m.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};

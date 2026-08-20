import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Please check your .env.local file.');
  console.warn('Required variables:');
  console.warn('  - VITE_SUPABASE_URL');
  console.warn('  - VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
      }
    }
  }
);

// Helper functions untuk Articles
export const articleService = {
  // Get all published articles
  async getAll(limit = 10, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching articles:', error);
      return { data: null, error };
    }
  },

  // Get featured articles
  async getFeatured(limit = 3) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('featured', true)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching featured articles:', error);
      return { data: null, error };
    }
  },

  // Get single article by slug
  async getBySlug(slug) {
    try {
      // Increment views
      await supabase.rpc('increment_views', { article_slug: slug });
      
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching article:', error);
      return { data: null, error };
    }
  },

  // Get articles by category
  async getByCategory(category, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('category', category)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      return { data: null, error };
    }
  },

  // Search articles
  async search(query, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error searching articles:', error);
      return { data: null, error };
    }
  },

  // Create new article (requires auth)
  async create(articleData) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .insert([articleData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating article:', error);
      return { data: null, error };
    }
  },

  // Update article (requires auth)
  async update(id, articleData) {
    try {
      const { data, error } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating article:', error);
      return { data: null, error };
    }
  },

  // Delete article (requires auth)
  async delete(id) {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting article:', error);
      return { data: false, error };
    }
  }
};

// Helper functions untuk Programs
export const programService = {
  async getAll(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching programs:', error);
      return { data: null, error };
    }
  },

  async getBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching program:', error);
      return { data: null, error };
    }
  },

  async create(programData) {
    try {
      const { data, error } = await supabase
        .from('programs')
        .insert([programData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating program:', error);
      return { data: null, error };
    }
  },

  async update(id, programData) {
    try {
      const { data, error } = await supabase
        .from('programs')
        .update(programData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating program:', error);
      return { data: null, error };
    }
  },

  async updateAmount(id, amount) {
    try {
      const { data, error } = await supabase
        .rpc('update_program_amount', { 
          program_id: id, 
          donation_amount: amount 
        });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating program amount:', error);
      return { data: null, error };
    }
  }
};

// Helper functions untuk Donations
export const donationService = {
  async create(donationData) {
    try {
      const { data, error } = await supabase
        .from('donations')
        .insert([donationData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Trigger edge function untuk notification (optional)
      // await supabase.functions.invoke('send-notification', {
      //   body: { type: 'new_donation', data }
      // });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating donation:', error);
      return { data: null, error };
    }
  },

  async getByDonor(email, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('donor_email', email)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching donations:', error);
      return { data: null, error };
    }
  }
};

// Helper functions untuk Testimonials
export const testimonialService = {
  async getAll(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      return { data: null, error };
    }
  },

  async create(testimonialData) {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert([testimonialData])
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating testimonial:', error);
      return { data: null, error };
    }
  }
};

// Helper functions untuk Contact Messages
export const contactService = {
  async sendMessage(messageData) {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([messageData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Trigger edge function untuk notification (optional)
      // await supabase.functions.invoke('send-notification', {
      //   body: { type: 'contact_message', data }
      // });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return { data: null, error };
    }
  }
};

// Helper functions untuk Storage (Images)
export const storageService = {
  // Upload image
  async uploadImage(bucket, file, path) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      return { data: { ...data, publicUrl }, error: null };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { data: null, error };
    }
  },

  // Delete image
  async deleteImage(bucket, path) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { data: false, error };
    }
  },

  // Get public URL
  getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
};

// Auth helpers (untuk Admin CMS)
export const authService = {
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  },

  async signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { data: false, error };
    }
  },

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data: session, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      return { data: null, error };
    }
  },

  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { data: user, error: null };
    } catch (error) {
      console.error('Error getting user:', error);
      return { data: null, error };
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

export default supabase;

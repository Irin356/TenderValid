// Browser-compatible database using localStorage
const STORAGE_KEYS = {
  RFPS: 'tender_validator_rfps',
  REQUIREMENTS: 'tender_validator_requirements',
  VENDORS: 'tender_validator_vendors',
  SESSIONS: 'tender_validator_sessions'
};

// Helper functions for localStorage
const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [];
  }
};

const setStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

export const database = {
  // RFP operations
  saveRfp: (name, content) => {
    const rfps = getStorageData(STORAGE_KEYS.RFPS);
    const id = generateId();
    const rfp = {
      id,
      name,
      content,
      uploaded_at: new Date().toISOString()
    };
    rfps.push(rfp);
    setStorageData(STORAGE_KEYS.RFPS, rfps);
    console.log(`RFP saved to localStorage with ID: ${id}`);
    return id;
  },

  getRfp: (id) => {
    const rfps = getStorageData(STORAGE_KEYS.RFPS);
    return rfps.find(rfp => rfp.id === id);
  },

  getAllRfps: () => {
    return getStorageData(STORAGE_KEYS.RFPS);
  },

  // Requirements operations
  saveRequirements: (rfpId, requirements) => {
    const allRequirements = getStorageData(STORAGE_KEYS.REQUIREMENTS);
    const newRequirements = requirements.map(req => ({
      id: generateId(),
      rfp_id: rfpId,
      category: req.category,
      text: req.text,
      keywords: req.keywords || [],
      priority: req.priority,
      confirmed: req.confirmed !== false,
      created_at: new Date().toISOString()
    }));

    // Remove existing requirements for this RFP
    const filteredRequirements = allRequirements.filter(req => req.rfp_id !== rfpId);
    const updatedRequirements = [...filteredRequirements, ...newRequirements];

    setStorageData(STORAGE_KEYS.REQUIREMENTS, updatedRequirements);
    console.log(`Saved ${newRequirements.length} requirements to localStorage`);
  },

  getRequirementsByRfp: (rfpId) => {
    const requirements = getStorageData(STORAGE_KEYS.REQUIREMENTS);
    return requirements.filter(req => req.rfp_id === rfpId);
  },

  updateRequirementConfirmation: (reqId, confirmed) => {
    const requirements = getStorageData(STORAGE_KEYS.REQUIREMENTS);
    const updatedRequirements = requirements.map(req =>
      req.id === reqId ? { ...req, confirmed: confirmed } : req
    );
    setStorageData(STORAGE_KEYS.REQUIREMENTS, updatedRequirements);
  },

  clearRequirements: (rfpId) => {
    const requirements = getStorageData(STORAGE_KEYS.REQUIREMENTS);
    const filteredRequirements = requirements.filter(req => req.rfp_id !== rfpId);
    setStorageData(STORAGE_KEYS.REQUIREMENTS, filteredRequirements);
  },

  // Vendor operations
  saveVendor: (name, rfpId, complianceScore, analysisData) => {
    const vendors = getStorageData(STORAGE_KEYS.VENDORS);
    const id = generateId();
    const vendor = {
      id,
      name,
      rfp_id: rfpId,
      compliance_score: complianceScore,
      analysis_data: analysisData,
      created_at: new Date().toISOString()
    };
    vendors.push(vendor);
    setStorageData(STORAGE_KEYS.VENDORS, vendors);
    console.log(`Vendor ${name} saved to localStorage with ID: ${id}`);
    return id;
  },

  getVendorsByRfp: (rfpId) => {
    const vendors = getStorageData(STORAGE_KEYS.VENDORS);
    return vendors.filter(vendor => vendor.rfp_id === rfpId);
  },

  updateVendor: (vendorId, complianceScore, analysisData) => {
    const vendors = getStorageData(STORAGE_KEYS.VENDORS);
    const updatedVendors = vendors.map(vendor =>
      vendor.id === vendorId
        ? { ...vendor, compliance_score: complianceScore, analysis_data: analysisData }
        : vendor
    );
    setStorageData(STORAGE_KEYS.VENDORS, updatedVendors);
  },

  clearVendors: (rfpId) => {
    const vendors = getStorageData(STORAGE_KEYS.VENDORS);
    const filteredVendors = vendors.filter(vendor => vendor.rfp_id !== rfpId);
    setStorageData(STORAGE_KEYS.VENDORS, filteredVendors);
  },

  // Session operations
  saveSession: (sessionId, data) => {
    const sessions = getStorageData(STORAGE_KEYS.SESSIONS);
    const existingIndex = sessions.findIndex(s => s.session_id === sessionId);

    const sessionData = {
      session_id: sessionId,
      data: data,
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      sessions[existingIndex] = sessionData;
    } else {
      sessions.push(sessionData);
    }

    setStorageData(STORAGE_KEYS.SESSIONS, sessions);
  },

  getSession: (sessionId) => {
    const sessions = getStorageData(STORAGE_KEYS.SESSIONS);
    const session = sessions.find(s => s.session_id === sessionId);
    return session ? session.data : null;
  },

  cleanupOldSessions: () => {
    const sessions = getStorageData(STORAGE_KEYS.SESSIONS);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const filteredSessions = sessions.filter(s => s.updated_at > oneDayAgo);
    setStorageData(STORAGE_KEYS.SESSIONS, filteredSessions);
  },

  // Utility functions
  close: () => {
    // localStorage doesn't need closing
  },

  // Get database stats
  getStats: () => {
    const rfps = getStorageData(STORAGE_KEYS.RFPS);
    const requirements = getStorageData(STORAGE_KEYS.REQUIREMENTS);
    const vendors = getStorageData(STORAGE_KEYS.VENDORS);

    // Calculate approximate storage size
    const data = JSON.stringify({ rfps, requirements, vendors });
    const sizeInMB = (new Blob([data]).size / (1024 * 1024)).toFixed(2);

    return {
      rfps: rfps.length,
      requirements: requirements.length,
      vendors: vendors.length,
      totalStorage: `${sizeInMB} MB`
    };
  },

  // Clear all data (for testing)
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('All localStorage data cleared');
  }
};

// Cleanup old sessions on module load
database.cleanupOldSessions();

export default database;
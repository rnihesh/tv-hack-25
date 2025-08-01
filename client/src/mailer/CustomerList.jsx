import { useState, useEffect } from 'react';
import { customerAPI } from '../utils/mailapi';

const CustomerList = ({ emailData, onDataUpdate, onBack, onNext }) => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState(emailData.selectedCustomers || []);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState('all');

  // Mock data for demonstration - replace with actual API call
  const mockCustomers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', segment: 'premium', lastActivity: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', segment: 'regular', lastActivity: '2024-01-10' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', segment: 'new', lastActivity: '2024-01-20' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', segment: 'premium', lastActivity: '2024-01-18' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', segment: 'regular', lastActivity: '2024-01-12' },
    { id: 6, name: 'Diana Davis', email: 'diana@example.com', segment: 'new', lastActivity: '2024-01-22' },
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const customers = await customerAPI.getCustomers();
      setCustomers(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Fallback to mock data if API fails
      setCustomers(mockCustomers);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = filterSegment === 'all' || customer.segment === filterSegment;
    return matchesSearch && matchesSegment;
  });

  const handleCustomerToggle = (customerId) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredCustomers.map(customer => customer.id);
    setSelectedCustomers(prev => {
      const isAllSelected = allFilteredIds.every(id => prev.includes(id));
      if (isAllSelected) {
        return prev.filter(id => !allFilteredIds.includes(id));
      } else {
        const newSelected = [...prev];
        allFilteredIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      }
    });
  };

  const handleNext = () => {
    onDataUpdate({ selectedCustomers });
    onNext();
  };

  const getSegmentColor = (segment) => {
    switch (segment) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'regular': return 'bg-blue-100 text-blue-800';
      case 'new': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading customers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Recipients</h2>
      
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <select
          value={filterSegment}
          onChange={(e) => setFilterSegment(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Segments</option>
          <option value="premium">Premium</option>
          <option value="regular">Regular</option>
          <option value="new">New</option>
        </select>
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium text-blue-900">
              {selectedCustomers.length} of {filteredCustomers.length} customers selected
            </span>
            {filterSegment !== 'all' && (
              <span className="ml-2 text-blue-700">
                (showing {filterSegment} segment)
              </span>
            )}
          </div>
          
          <button
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {filteredCustomers.every(customer => selectedCustomers.includes(customer.id))
              ? 'Deselect All'
              : 'Select All'
            }
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="max-h-96 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No customers found matching your criteria.
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className={`flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedCustomers.includes(customer.id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => handleCustomerToggle(customer.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSegmentColor(customer.segment)}`}>
                      {customer.segment}
                    </span>
                    <span className="text-xs text-gray-500">
                      Active: {new Date(customer.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Estimated Reach */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{selectedCustomers.length}</div>
          <div className="text-sm text-green-800">Recipients</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">~{Math.round(selectedCustomers.length * 0.25)}</div>
          <div className="text-sm text-blue-800">Expected Opens</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">~{Math.round(selectedCustomers.length * 0.05)}</div>
          <div className="text-sm text-purple-800">Expected Clicks</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          ← Back to Preview
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Step 3 of 4
          </div>
          
          <button
            onClick={handleNext}
            disabled={selectedCustomers.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Continue to Send →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerList;

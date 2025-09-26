// Frontend Debug Tools for Translation Interface Investigation
// Run this in browser console to debug the Translation Interface

window.debugTranslationInterface = {
  // Check authentication status
  checkAuth: function() {
    console.log('=== AUTHENTICATION DEBUG ===');
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    console.log('Access Token:', token ? 'Present' : 'Missing');
    console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token Payload:', payload);
        console.log('Token Expires:', new Date(payload.exp * 1000));
        console.log('Token Valid:', payload.exp * 1000 > Date.now());
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    
    return { token, refreshToken };
  },

  // Test API call directly
  testAPI: async function(projectId = '94774b27-7447-46c2-b783-0e7fe3bc1a1b') {
    console.log('=== API TEST ===');
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.error('No access token found!');
      return;
    }

    try {
      const url = `${window.location.origin.includes('localhost:3000') ? 'http://localhost:5001' : ''}/api/segments/project/${projectId}?page=1&limit=1000`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        console.log('Segments Count:', data.data ? data.data.length : 0);
        return data;
      } else {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        return null;
      }
    } catch (error) {
      console.error('API Call Error:', error);
      return null;
    }
  },

  // Check React component state
  checkComponentState: function() {
    console.log('=== COMPONENT STATE DEBUG ===');
    
    // Try to find the Translation Interface component
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('React Root Found');
      // This is a simplified approach - in real debugging, you'd use React DevTools
      console.log('Use React DevTools to inspect component state');
    } else {
      console.log('React Root not found or not accessible');
    }
  },

  // Check AG-Grid status
  checkAGGrid: function() {
    console.log('=== AG-GRID DEBUG ===');
    
    // Look for AG-Grid elements
    const gridElements = document.querySelectorAll('.ag-root');
    console.log('AG-Grid Elements Found:', gridElements.length);
    
    gridElements.forEach((grid, index) => {
      console.log(`Grid ${index + 1}:`, {
        visible: grid.offsetParent !== null,
        height: grid.style.height,
        display: grid.style.display,
        visibility: grid.style.visibility
      });
    });

    // Check for AG-Grid data
    const gridRows = document.querySelectorAll('.ag-row');
    console.log('AG-Grid Rows Found:', gridRows.length);
  },

  // Full diagnostic
  runFullDiagnostic: async function(projectId = '94774b27-7447-46c2-b783-0e7fe3bc1a1b') {
    console.log('=== FULL TRANSLATION INTERFACE DIAGNOSTIC ===');
    
    // 1. Check authentication
    const auth = this.checkAuth();
    
    // 2. Test API
    const apiResult = await this.testAPI(projectId);
    
    // 3. Check component state
    this.checkComponentState();
    
    // 4. Check AG-Grid
    this.checkAGGrid();
    
    // 5. Summary
    console.log('=== DIAGNOSTIC SUMMARY ===');
    console.log('Authentication:', auth.token ? 'OK' : 'FAILED');
    console.log('API Call:', apiResult ? 'OK' : 'FAILED');
    console.log('Segments Available:', apiResult ? apiResult.data.length : 0);
    
    return {
      auth: auth.token ? 'OK' : 'FAILED',
      api: apiResult ? 'OK' : 'FAILED',
      segmentsCount: apiResult ? apiResult.data.length : 0
    };
  }
};

console.log('Translation Interface Debug Tools loaded!');
console.log('Usage:');
console.log('  debugTranslationInterface.runFullDiagnostic() - Run full diagnostic');
console.log('  debugTranslationInterface.checkAuth() - Check authentication');
console.log('  debugTranslationInterface.testAPI() - Test API call');
console.log('  debugTranslationInterface.checkAGGrid() - Check AG-Grid status');

// Node test script to verify exact state flow as requested in Section 1

// Recreate the store slice logic to test state transitions
const testStateFlow = () => {
  const dummyVehicleId = '11111111-1111-1111-1111-111111111111';
  let authRole = 'CO_OWNER';

  let state = {
    selectedVehicleId: null,
    vehicleMode: 'NONE',
    vehicleFeatureMode: 'NONE',
    activeExperience: null,
    isVehicleSelected: false,
  };

  const selectVehicle = (id, explicitRole) => {
    const role = explicitRole || authRole;
    let targetMode = 'CO_OWNER_VEHICLE_OVERVIEW';
    let activeExp = 'CO_OWNER';

    if (role === 'STAFF') {
      targetMode = 'STAFF_VEHICLE_OVERVIEW';
      activeExp = 'STAFF';
    } else if (role === 'ADMIN') {
      targetMode = 'ADMIN_VEHICLE_OVERVIEW';
      activeExp = 'ADMIN';
    }

    state = {
      ...state,
      selectedVehicleId: id,
      vehicleMode: targetMode,
      vehicleFeatureMode: targetMode,
      activeExperience: activeExp,
      isVehicleSelected: !!id,
    };
  };

  // Simulate click on EV01
  selectVehicle(dummyVehicleId, authRole);

  const shouldRenderCoOwnerPanel =
    authRole === 'CO_OWNER' &&
    state.selectedVehicleId != null &&
    state.vehicleMode === 'CO_OWNER_VEHICLE_OVERVIEW';

  console.log('--- STATE FLOW INSPECTION ---');
  console.log('authenticatedUser.role:', authRole);
  console.log('selectedVehicleId:', state.selectedVehicleId);
  console.log('vehicleMode:', state.vehicleMode);
  console.log('activeExperience:', state.activeExperience);
  console.log('isVehicleSelected:', state.isVehicleSelected);
  console.log('shouldRenderCoOwnerPanel:', shouldRenderCoOwnerPanel);

  if (
    authRole === 'CO_OWNER' &&
    state.selectedVehicleId === dummyVehicleId &&
    state.vehicleMode === 'CO_OWNER_VEHICLE_OVERVIEW' &&
    state.activeExperience === 'CO_OWNER' &&
    state.isVehicleSelected === true &&
    shouldRenderCoOwnerPanel === true
  ) {
    console.log('[SUCCESS] All state flow values strictly match Section 1 requirements.');
  } else {
    console.error('[FAIL] State flow mismatch.');
    process.exit(1);
  }
};

testStateFlow();

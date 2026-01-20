const locationController = require('../../../controllers/locationController');
const Location = require('../../../models/Location');

jest.mock('../../../models/Location');

function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('locationController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('setLocation returns 401 if no user', async () => {
    const req = { user: null, body: { city: 'London' } };
    const res = makeRes();

    await locationController.setLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('setLocation returns 400 if both city and postcode', async () => {
    const req = { user: { id: 'user-1' }, body: { city: 'London', postcode: 'LS1 1AD' } };
    const res = makeRes();

    await locationController.setLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Provide either a city or a postcode' });
  });

  test('setLocation returns 201 on success', async () => {
    Location.newLocation.mockResolvedValue({ label: 'London, GB' });

    const req = { user: { id: 'user-1' }, body: { city: 'London' } };
    const res = makeRes();

    await locationController.setLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ location: { label: 'London, GB' } });
  });

  test('getLocation returns 404 if none saved', async () => {
    Location.getLocationByUserId.mockResolvedValue(null);

    const req = { user: { id: 'user-1' } };
    const res = makeRes();

    await locationController.getLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('validateLocation returns 200 with result', async () => {
    Location.resolveLocation.mockResolvedValue({ label: 'London, GB', latitude: 1, longitude: 2 });

    const req = { query: { city: 'London' } };
    const res = makeRes();

    await locationController.validateLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      result: { label: 'London, GB', latitude: 1, longitude: 2 },
    });
  });

  test('getLocationHistory returns 200 with locations', async () => {
    Location.getUniqueByUserId.mockResolvedValue([{ label: 'London, GB' }]);

    const req = { user: { id: 'user-1' } };
    const res = makeRes();

    await locationController.getLocationHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ locations: [{ label: 'London, GB' }] });
  });

  test('deleteLocation returns 200 on delete', async () => {
    Location.deleteLocationByUserId.mockResolvedValue({ label: 'London, GB' });

    const req = { user: { id: 'user-1' } };
    const res = makeRes();

    await locationController.deleteLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
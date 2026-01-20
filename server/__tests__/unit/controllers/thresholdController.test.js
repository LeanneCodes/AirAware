const thresholdController = require('../../../controllers/thresholdController');
const Threshold = require('../../../models/Threshold');

jest.mock('../../../models/Threshold');

function makeRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe('thresholdController (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getThresholds returns 401 if no user', async () => {
    const req = { user: null };
    const res = makeRes();

    await thresholdController.getThresholds(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getThresholds returns 404 if none exist', async () => {
    Threshold.getByUserId.mockResolvedValueOnce(null);

    const req = { user: { id: 'user-1' } };
    const res = makeRes();

    await thresholdController.getThresholds(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getThresholds returns 200 with thresholds', async () => {
    Threshold.getByUserId.mockResolvedValueOnce({
      userId: 'user-1',
      triggerAqi: 3,
      useDefault: false,
    });

    const req = { user: { id: 'user-1' } };
    const res = makeRes();

    await thresholdController.getThresholds(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  test('setThresholds returns 401 if no user', async () => {
    const req = { user: null, body: { sensitivity: 'moderate' } };
    const res = makeRes();

    await thresholdController.setThresholds(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('setThresholds returns 400 if sensitivity missing', async () => {
    const req = { user: { id: 'user-1' }, body: {} };
    const res = makeRes();

    await thresholdController.setThresholds(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('setThresholds maps "moderate" and creates thresholds', async () => {
    Threshold.newThresholds.mockResolvedValueOnce({
      userId: 'user-1',
      triggerAqi: 3,
      useDefault: false,
    });

    const req = { user: { id: 'user-1' }, body: { sensitivity: 'moderate' } };
    const res = makeRes();

    await thresholdController.setThresholds(req, res);

    expect(Threshold.newThresholds).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        useDefault: false,
        triggerAqi: 3,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updateThresholds returns 404 if nothing to update', async () => {
    Threshold.updateThresholdsByUserId.mockResolvedValueOnce(null);

    const req = { user: { id: 'user-1' }, body: { sensitivity: 'poor' } };
    const res = makeRes();

    await thresholdController.updateThresholds(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('getDefaultThresholds returns 200 with defaults', async () => {
    const req = {};
    const res = makeRes();

    await thresholdController.getDefaultThresholds(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        defaults: expect.any(Object),
      })
    );
  });
});

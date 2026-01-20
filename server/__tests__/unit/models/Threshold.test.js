const Threshold = require('../../../models/Threshold');
const db = require('../../../db/connect');

jest.mock('../../../db/connect', () => ({
  query: jest.fn(),
}));

describe('Threshold model (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getByUserId returns null when no rows', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await Threshold.getByUserId('user-1');
    expect(result).toBeNull();
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  test('getByUserId returns Threshold instance when found', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 't-1',
          user_id: 'user-1',
          trigger_aqi: 3,
          use_default: false,
          updated_at: new Date().toISOString(),
        },
      ],
    });

    const result = await Threshold.getByUserId('user-1');
    expect(result).toBeInstanceOf(Threshold);
    expect(result.userId).toBe('user-1');
    expect(result.triggerAqi).toBe(3);
    expect(result.useDefault).toBe(false);
  });

  test('newThresholds inserts and returns Threshold instance', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 't-2',
          user_id: 'user-2',
          trigger_aqi: null,
          use_default: true,
          updated_at: new Date().toISOString(),
        },
      ],
    });

    const created = await Threshold.newThresholds({
      userId: 'user-2',
      triggerAqi: null,
      useDefault: true,
    });

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(created).toBeInstanceOf(Threshold);
    expect(created.userId).toBe('user-2');
    expect(created.triggerAqi).toBeNull();
    expect(created.useDefault).toBe(true);
  });

  test('updateThresholdsByUserId returns null when nothing updated', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const updated = await Threshold.updateThresholdsByUserId({
      userId: 'user-3',
      triggerAqi: 4,
      useDefault: false,
    });

    expect(updated).toBeNull();
  });

  test('updateThresholdsByUserId returns Threshold instance when updated', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 't-3',
          user_id: 'user-3',
          trigger_aqi: 4,
          use_default: false,
          updated_at: new Date().toISOString(),
        },
      ],
    });

    const updated = await Threshold.updateThresholdsByUserId({
      userId: 'user-3',
      triggerAqi: 4,
      useDefault: false,
    });

    expect(updated).toBeInstanceOf(Threshold);
    expect(updated.triggerAqi).toBe(4);
    expect(updated.useDefault).toBe(false);
  });
});
import { jest } from '@jest/globals';

const mockPost = jest.fn();

// Mock axios before importing askAi
jest.unstable_mockModule('axios', () => ({
  default: {
    post: mockPost,
  },
}));

const { askAi } = await import('../services/openRouter.service.js');

describe('openRouter Service (askAi) Security Hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should make a post request with a strict timeout configuration', async () => {
    mockPost.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: 'Mocked AI Response',
            },
          },
        ],
      },
    });

    const messages = [{ role: 'user', content: 'Hello' }];
    const response = await askAi(messages);

    expect(response).toBe('Mocked AI Response');
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages,
      },
      expect.objectContaining({
        timeout: 15000,
        headers: expect.any(Object),
      })
    );
  });

  it('should throw an error if the request fails or times out', async () => {
    mockPost.mockRejectedValue(new Error('Timeout / Network Error'));

    const messages = [{ role: 'user', content: 'Hello' }];
    await expect(askAi(messages)).rejects.toThrow('Groq API Error');
  });

  it('should throw an error if messages parameter is empty or invalid', async () => {
    await expect(askAi([])).rejects.toThrow('Message array is empty.');
    await expect(askAi(null)).rejects.toThrow('Message array is empty.');
  });
});

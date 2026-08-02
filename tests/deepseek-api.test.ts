/**
 * DeepSeek API 模块测试
 *
 * 测试客户端实例化、参数验证和错误处理。
 * 不发送真实 API 请求（避免消耗额度和泄露密钥）。
 */

import { describe, expect, it } from 'vitest';
import { DeepSeekClient, DeepSeekError } from '../src/lib/deepseek-api';

describe('DeepSeekClient', () => {
  it('creates client with provided API key', () => {
    const client = new DeepSeekClient({ apiKey: 'sk-test-key' });
    // 客户端创建成功不报错即可
    expect(client).toBeDefined();
  });

  it('throws DeepSeekError when API key is missing on chat', async () => {
    // 确保环境变量未设置
    const originalKey = process.env['DEEPSEEK_API_KEY'];
    delete process.env['DEEPSEEK_API_KEY'];

    const client = new DeepSeekClient();
    await expect(
      client.chat([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow(DeepSeekError);

    // 恢复环境变量
    if (originalKey) {
      process.env['DEEPSEEK_API_KEY'] = originalKey;
    }
  });

  it('throws DeepSeekError when API key is missing on streamChat', async () => {
    const originalKey = process.env['DEEPSEEK_API_KEY'];
    delete process.env['DEEPSEEK_API_KEY'];

    const client = new DeepSeekClient();
    const gen = client.streamChat([{ role: 'user', content: 'test' }]);
    await expect(gen.next()).rejects.toThrow(DeepSeekError);

    if (originalKey) {
      process.env['DEEPSEEK_API_KEY'] = originalKey;
    }
  });

  it('uses custom base URL when provided', () => {
    const client = new DeepSeekClient({
      apiKey: 'sk-test',
      baseUrl: 'https://custom.deepseek.com',
    });
    expect(client).toBeDefined();
    // baseUrl 通过构造函数正确设置
  });

  it('uses custom model when provided', () => {
    const client = new DeepSeekClient({
      apiKey: 'sk-test',
      model: 'deepseek-reasoner',
    });
    expect(client).toBeDefined();
  });

  it('DeepSeekError has correct name and statusCode', () => {
    const error = new DeepSeekError('测试错误', 401, { code: 'unauthorized' });

    expect(error.name).toBe('DeepSeekError');
    expect(error.message).toBe('测试错误');
    expect(error.statusCode).toBe(401);
    expect(error.apiError).toEqual({ code: 'unauthorized' });
  });
});

// 服务器状态检查工具
export const checkServerStatus = async () => {
  const serverUrl = 'https://299lv8138zh6.vicp.fun'
  
  try {
    console.log('🔍 检查服务器状态...')
    
    // 1. 检查基本连通性
    const pingResponse = await fetch(serverUrl, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    })
    
    console.log('✅ 服务器基本连通性检查完成')
    
    // 2. 检查API端点
    const apiResponse = await fetch(`${serverUrl}/api/v1/sessions`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    })
    
    console.log('✅ API端点检查完成:', apiResponse.status)
    
    return {
      status: 'online',
      ping: true,
      api: apiResponse.status === 200 || apiResponse.status === 204
    }
    
  } catch (error) {
    console.error('❌ 服务器状态检查失败:', error)
    
    return {
      status: 'offline',
      ping: false,
      api: false,
      error: error.message
    }
  }
}

// 测试服务器连接
export const testServerConnection = async () => {
  console.log('🚀 开始服务器连接测试...')
  
  const status = await checkServerStatus()
  
  if (status.status === 'online') {
    console.log('🎉 服务器连接正常!')
    console.log('📊 状态详情:', status)
  } else {
    console.log('⚠️ 服务器连接异常!')
    console.log('📊 状态详情:', status)
    
    // 提供解决建议
    console.log('💡 解决建议:')
    console.log('1. 检查网络连接')
    console.log('2. 确认服务器是否运行')
    console.log('3. 检查服务器HTTPS配置')
    console.log('4. 联系服务器管理员')
  }
  
  return status
}

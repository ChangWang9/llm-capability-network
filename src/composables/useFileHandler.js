import { ref } from 'vue'
import { useDataProcessor } from './useDataProcessor'

export function useFileHandler() {
  const { processFile } = useDataProcessor()
  const isUploading = ref(false)
  const uploadError = ref(null)

  const handleFileUpload = async (file) => {
    isUploading.value = true
    uploadError.value = null

    try {
      await processFile(file)
      return true
    } catch (error) {
      uploadError.value = error.message
      throw error
    } finally {
      isUploading.value = false
    }
  }

  const validateFile = (file) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('请上传 Excel 文件 (.xlsx 或 .xls)')
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('文件大小不能超过 10MB')
    }

    return true
  }

  return {
    isUploading,
    uploadError,
    handleFileUpload,
    validateFile
  }
}
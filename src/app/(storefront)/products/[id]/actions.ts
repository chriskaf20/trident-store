'use server'

export async function submitReview(prevState: any, formData: FormData) {
    // Mock review submission delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const rating = Number(formData.get('rating') || 0)
    
    if (rating === 0) {
        return { error: 'Please select a star rating.' }
    }

    return { success: true }
}

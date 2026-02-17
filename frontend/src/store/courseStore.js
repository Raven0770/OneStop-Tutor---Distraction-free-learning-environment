import { create } from 'zustand'

export const useCourseStore = create((set) => ({
  courses: [],
  currentCourse: null,
  currentVideo: null,

  setCourses: (courses) => set({ courses }),

  setCurrentCourse: (course) => set({ currentCourse: course }),

  setCurrentVideo: (video) => set({ currentVideo: video }),

  addCourse: (course) => set((state) => ({
    courses: [...state.courses, course]
  })),

  removeCourse: (courseId) => set((state) => ({
    courses: state.courses.filter(c => c.id !== courseId)
  })),

  updateCourse: (courseId, updates) => set((state) => ({
    courses: state.courses.map(c =>
      c.id === courseId ? { ...c, ...updates } : c
    )
  })),
}))

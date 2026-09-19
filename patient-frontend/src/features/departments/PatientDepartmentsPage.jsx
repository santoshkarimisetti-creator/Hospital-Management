// PatientDepartmentsPage — now delegates to the unified DepartmentsManagePage
// which handles all roles (Patient sees Book buttons, Admin sees Edit/Delete)
export { DepartmentsManagePage as default, DepartmentsManagePage as PatientDepartmentsPage } from './DepartmentsManagePage';

import { Doctor, Prisma, Role } from "@prisma/client";
import prisma from "../../../constants/prisma";
import ApiError from "../../../errors/ApiError";
import { hashPassword } from "../../../helpers/bcrypt";
import { IDoctorFilters, IDoctorWithoutPassword } from "./interface";
import IPaginationOptions from "../../../interfaces/pagination";
import { IGenericResponse } from "../../../interfaces/common";
import { calculatePagination } from "../../../helpers/pagination";
import { doctorSearchableFields, select } from "./constant";

const createDoctor = async (data: Doctor): Promise<Doctor> => {
  let doctor;

  const isExist = await prisma.user.findFirst({
    where: { name: data.name, email: data.email },
  });

  if (isExist) throw new ApiError(409, "The user is already registered!!");

  data.password = await hashPassword(data.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: Role.DOCTOR,
      },
    });

    doctor = await tx.doctor.create({ data });
  });

  if (!doctor) throw new ApiError(400, "Failed to create doctor!!");

  return doctor;
};

const getDoctor = async (id: string): Promise<IDoctorWithoutPassword> => {
  const doctor = await prisma.doctor.findUnique({ where: { id }, select });

  if (!doctor) throw new ApiError(404, "Doctor not found!!");

  return doctor;
};

const getDoctors = async (
  { searchTerm, ...filtersData }: IDoctorFilters,
  options: IPaginationOptions
): Promise<IGenericResponse<IDoctorWithoutPassword[]>> => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);

  const pipeline = [];

  if (searchTerm) {
    pipeline.push({
      OR: doctorSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filtersData).length > 0) {
    pipeline.push({
      AND: Object.keys(filtersData).map((key) => ({
        [key]: { equals: (filtersData as any)[key] },
      })),
    });
  }

  const where: Prisma.DoctorWhereInput =
    pipeline.length > 0 ? { AND: pipeline } : {};

  const result = await prisma.doctor.findMany({
    where,
    select,
    skip,
    take: limit,
    orderBy:
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: "desc" },
  });

  const total = await prisma.doctor.count({ where });

  return {
    meta: { page, limit, total },
    data: result,
  };
};

export const DoctorService = { createDoctor, getDoctor, getDoctors };

/*
  Copyright (C) 2007 National Institute For Space Research (INPE) - Brazil.

  This file is part of TerraMA2 - a free and open source computational
  platform for analysis, monitoring, and alert of geo-environmental extremes.

  TerraMA2 is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License,
  or (at your option) any later version.

  TerraMA2 is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with TerraMA2. See LICENSE. If not, write to
  TerraMA2 Team at <terrama2-team@dpi.inpe.br>.
*/

/*!
  \file terrama2/core/data-model/DataProvider.hpp

  \brief Models the information of a DataProvider (or data server).

  \author Evandro Delatin
*/

#ifndef __TERRAMA2_CORE_DATA_MODEL_DATAPROVIDER_HPP__
#define __TERRAMA2_CORE_DATA_MODEL_DATAPROVIDER_HPP__

// TerraMA2
#include "../typedef.hpp"
#include "DataSeries.hpp"

// STL
#include <string>
#include <vector>

//terralib
#include <terralib/common/URI/uri.h>

namespace terrama2
{
  namespace core
  {
    /*!
      \struct DataProvider

      \brief Models the information of a DataProvider (or data server).

      A DataProvider can be a remote server that provides data through
      FTP protocol or an OGC Web Service, such as WFS, WCS or SOS.

      It can also be an URI for a folder into the file system.

      A DataProvider contains the list of dataseries that belongs to this provider
      that should be collected for further analysis.
     */

    typedef uint64_t DataProviderType;//TODO: fix types
    struct DataProvider
    {
      enum DataProviderIntent
      {
        COLLECTOR_INTENT,
        PROCESS_INTENT
      };

      DataProviderId id; //!< The identifier of the DataProvider.
      ProjectId projectId; //!< The identifier of the Project
      std::string name; //!< Name of the DataProvider, must be unique.
      std::string description; //!< Description from the source of the DataProvider.
      DataProviderType dataProviderType; //!< Type of the DataProvider (FTP, WCS, ...).
      DataProviderIntent intent; //!< Intent os the DataProvider.
      te::common::uri::uri uri; //!< URI to access the DataProvider data.
      bool active; //!< DataProvider status.

      std::vector<DataSeries> dataseries; //TODO: id or object?
    };

  } // end namespace core
}   // end namespace terrama2

#endif  // __TERRAMA2_CORE_DATA_MODEL_DATAPROVIDER_HPP__
